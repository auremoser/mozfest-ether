'use strict';

var fs = require('fs');
var rp = require('request-promise');

//load the data.json file, which is a CSV to JSON dump
//from the spreadsheet
var data = require('./data.json');

//im just ordering by session id, just cose...
data.sort(function(a, b){
  return b['session id'] - a['session id'];
});

//Here you can update the terms you want to count occurrence on each etherpad
//make this all lowercase.
var TERMS = ["open", "libre", "innovation", "inclusion", "privacy", "science"];

var STATS = {errors:0};


//collect sessions with the suffix /export/txt
//so it points to the downloadable file
var sessions = [];
data.map(function(item){
    item = cleanUpObjectKeys(item);
    var validUrl = true;

    if(item.etherpad.indexOf('public.etherpad-mozilla.org') === -1){
      console.warn('Session ID %s: invalid URL provided: %s', item['session id'], item.etherpad);
      validUrl = false;
    }

    if(!item.etherpad){
      console.warn('Session ID %s: no URL provided.', item['session id']);
      validUrl = false;
    }

    item.id = item.session_id;
    item.url = item.etherpad + '/export/txt';


    delete item.field12;

    sessions.push(item);
});


function download(session, next){
    console.log('Downloading session id %s from: %s', session.id, session.title);
    rp(session.url).then(function(body){
        //Nasty, but oh well. Get the etherpad name
        var filename = session.id;
        session.notes = body;
        //this is kinda sleazy but works, if the etherpad has the default message then its
        //empty.
        session.empty = checkEtherpathEmpty(body);
        session.character_count = session.empty ? 0 : countChars(body);
        //term_occurrence takes into consideration the title, but only for those
        //etherpads that have real content...
        session.term_occurrence = session.empty ? emptyCounter(TERMS) : countOccurrenceOf(TERMS, session.title + ' ' + body);

        getSpaceStats(session);

        saveFile(filename, JSON.stringify(session, null, 4), next);
    }).catch(function(err){
      console.error('* Error downloading session id %s: %s', session.id, err.message);
      //we keep track of how many errors we had...
      STATS.errors++;

      var filename = 'error_' + session.id;
      session.error = err.message;
      saveFile(filename, JSON.stringify(session, null, 4), next);
    });
}

function saveFile(pad, body, next){
    var filename = './pads/' + pad + '.json';
    console.log('* Saving file %s', filename);
    fs.writeFileSync(filename, body);
    next();
}

function step(){
    var session = sessions.pop();
    if(! session) return done();
    download(session, step);
}

function done(){
    console.log('DONE!');
    console.log('STATS:');
    var output = JSON.stringify(STATS, null, 4);
    console.log(output);
    fs.writeFileSync('./stats.json', output);
}

process.on('SIGINT', function() {
  done();
  process.exit();
});

console.log('Downloading %s etherpads!!', sessions.length);
STATS.total_etherpads = sessions.length;
step();


function cleanUpObjectKeys(item){
  var out = {}, key;
  Object.keys(item).map(function(k){
    key = normalizeString(k);
    out[key] = item[k];
  });
  return out;
}

function normalizeString(k){
  return (k || '').replace(/\s/g, '_').toLowerCase();
}

function getSpaceStats(session){
  var title = normalizeString(session.space);
  var stats = STATS[title];

  //if we havent collected any stats on this space
  //create a blank object;
  if(!stats){
    stats = STATS[title] = {
      // title: session.space,
      etherpads: 0,
      character_count: 0,
      empty: 0,
      total_favs: 0,
      fav_count: 0,
      unfav_count: 0,
      session_notes: 0,
      views: 0,
      term_occurrence: emptyCounter(TERMS)
    };
  }

  function count(obj, item){
    var value;
    Object.keys(obj).map(function(key){
        value = item[key];

        if(typeof value === 'boolean'){
          //here we abuse the fact that JS will treat false as 0 and true as 1 :P
          obj[key] += value;
        }

        if(typeof value === 'number'){
          obj[key] += value;
        }
        if(typeof value === 'object') count(obj[key], value);
    });
  }

  count(stats, session);

  //We also count how many etherpads per "space".
  stats.etherpads++;
}

function checkEtherpathEmpty(txt){
  if(!txt) return true;
  return txt.indexOf('Welcome to Etherpad') !== -1;
}

function countChars(txt){
  return (txt || '').length;
}

//http://stackoverflow.com/questions/1400235/count-occurances-in-string-from-keyword-array-in-javascript
function countOccurrenceOf(terms, text) {
    text = text.toLowerCase();

    var x, i, output = {}, term;
    for (x = 0; x < terms.length; x++) {
    	i = 0, term = terms[x];
    	output[term] = 0;
    	while ((i = text.indexOf(term, i)) > -1) {
    		output[term]++;
    		i++;
    	}
    }
    return output;
}

function emptyCounter(terms){
  var out = {};
  terms.map(function(term){
    out[term] = 0;
  });
  return out;
}