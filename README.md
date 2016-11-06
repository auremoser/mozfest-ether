# mozfest-ether
etherpad stuff for mozfest 2016

## Sources

Etherpads were created for each Mozfest 2016 session, accessible from the [website](https://app.mozillafestival.org/) via the `notes` button. Sessions were organized into 11 [spaces](https://app.mozillafestival.org/#_spaces).

Matthew made a [spreadsheet of all etherpads](https://docs.google.com/spreadsheets/d/1917IgUyfj3-lw2W7aX2MaBPlNrQF0T0G5GeiLpw86rQ/edit?usp=sharing) with their titles and topics and some other stats.

## Purpose

Hopefully, we can create some kind of reusable process for mining the etherpads. Here's just a test for that.

## Requirements

* extract the text from all the etherpads, maybe just download them all as we did once before for my workweek in London
* get some stats on what was actually discussed in the etherpads
  * how many etherpads are empty?
  * how much text was written in each of them (character count)?
  * how many times did certain keywords/phrases appear (like "open", "libre", "innovation", "inclusion", "privacy", "science")
  * which "space" was more text heavy, as in, which space took more notes?
  
## Output

This script creates:

* 1 json file per etherpad with text contents
* 1 `stats.json` file with brief counts and general things listed in the requirements

### To run:

1. Convert Matthew's CSV from the spreadsheet into JSON format using a [tool like this one][http://www.convertcsv.com/csv-to-json.htm].
2. npm install `request-promise`
3. `node index.js`
4. Use the `index.js` script to collect each etherpad's URLs and download the content for each, creating a txt file for each. 


### Thanks

Emi for the tips in setting this up!