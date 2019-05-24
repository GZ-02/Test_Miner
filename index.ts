// Import package that allows meta-data harvesting according to the OAI protocol
import { OaiPmh } from 'oai-pmh'
const fs = require('fs');
var download = require('download-pdf');
const pdf = require('pdf-parse');


var i = 0;
var myArray = ['master thesis', 'bachelor thesis', 'doctoral thesis', 'journal article','review','conference paper','book','book chapter','public lecture'];
const url = 'http://oai.tudelft.nl/ir';
var url2, uid, newUrl, educ,lngth;

// Function to get the copyrights from an array
function GetRightsFromArray(record){
  var answer = "";
  console.log(record.metadata["oai_dc:dc"]["dc:rights"]);
  for (var k = 0; k<record.metadata["oai_dc:dc"]["dc:rights"].length; k++){
    answer = (GetRightsFromString(record.metadata["oai_dc:dc"]["dc:rights"][k]) === null) ? answer : GetRightsFromString(record.metadata["oai_dc:dc"]["dc:rights"][k]) ;
  }
  console.log("Answer:", answer);
}

// Function to get copyrights from string
function GetRightsFromString(record){
  if ( record.includes("CC-BY-NC-ND") || record.includes("BY-NC-ND") || record.includes("BY NC ND") || record.includes("NonCommercial-NoDerivs") ){
    console.log("License CC-BY-NC-ND: ", record);
    return "CC-BY-NC-ND";
  }
  else if ( record.includes("CC-BY-NC-SA") || record.includes("BY-NC-SA") || record.includes("BY NC SA") || record.toLowerCase().includes("NonCommercial-ShareAlike") || record.toLowerCase().includes("noncommercial share alike") || record.toLowerCase().includes("non-commercial share alike") ){
    console.log("License CC-BY-NC-SA: ", record);
    return "CC-BY-NC-SA";
  }
  else if ( record.includes("CC-BY-NC") || record.includes("BY-NC") || record.includes("BY NC") || record.toLowerCase().includes("noncommercial") || record.toLowerCase().includes("non commercial") || record.toLowerCase().includes("non-commercial")){
    console.log("License CC-BY-NC: ", record);
    return "CC-BY-NC";
  }
  else if ( record.includes("CC-BY-ND") || record.includes("BY-ND") || record.includes("BY ND") || record.includes("by-nd") ){
    console.log("License CC-BY-ND: ", record);
    return "CC-BY-ND";
  }
  else if ( record.includes("CC-BY-SA") || record.includes("BY-SA") || record.includes("BY SA") ){
    console.log("License CC-BY-SA: ", record);
    return "CC-BY-SA";
  }
  else if ( record.includes("CC-BY") || record.includes("BY") || record.includes("/by") || record.toLowerCase().includes("creative commons 3.0") || record.toLowerCase().includes("license 4.0") || record.toLowerCase().includes("attribution 3.0") || record.toLowerCase().includes("attribution 4.0") || record.toLowerCase().includes("provided the original work is properly cited") || record.toLowerCase().includes("permits unrestricted use, distribution, and reproduction in any medium, provided") ){
    console.log("License CC-BY: ", record);
    return "CC-BY";
  }
  else if ( record.includes("CC0") || record.includes("(c0)") ){
    console.log("License CC0: ", record);
    return "CC0";
  }
  else if ( record.toLowerCase().includes("(c)") || record.toLowerCase().includes("©") ){
    console.log("License C:", record);
    return "C";
  }
  else{
    console.log("Other: ", record);
    return null;
  }
}

//Function to get the metadata I need for a resource
async function getMetadata(item, index){
  // The resource is deleted or undefined
  if ('$' in item.header && item.header['$'] == undefined && item.header['$']['status'] == 'deleted'){
    //console.log("Undefined item");
  }
  // The resoure has no metadata
  else if (item.metadata == undefined){
    //console.log ("Undefined metadata");
  }
  else{
    if ( item.metadata["oai_dc:dc"]["dc:language"] === "en" ){

      if ( Array.isArray(item.metadata["oai_dc:dc"]["dc:identifier"]) ){
        for (var j=0; j<(item.metadata["oai_dc:dc"]["dc:identifier"]).length; j++){
          if (item.metadata["oai_dc:dc"]["dc:identifier"][j].includes("http")) {
            url2 = item.metadata["oai_dc:dc"]["dc:identifier"][j];
            uid = (url2.split("nl/"))[1];
            newUrl = "https://repository.tudelft.nl/islandora/object/"+uid+"/datastream/OBJ/download";
          }
        }
      }
      else if(item.metadata["oai_dc:dc"]["dc:identifier"] !== undefined){
        url2 = item.metadata["oai_dc:dc"]["dc:identifier"];
        uid = (url2.split("nl/"))[1];
        newUrl = "https://repository.tudelft.nl/islandora/object/"+uid+"/datastream/OBJ/download";
      }
      else{
        url2 = null;
        uid = null;
        newUrl = null;
      }

      // Educational level
      if (url2 !== null){
        if ( Array.isArray(item.metadata["oai_dc:dc"]["dc:type"]) ){
          if ( myArray.includes(item.metadata["oai_dc:dc"]["dc:type"][0]) ){
            educ = item.metadata["oai_dc:dc"]["dc:type"][0];
          }
        }
        else if (item.metadata["oai_dc:dc"]["dc:type"] === undefined){
          educ = null;
        }
        else if ( myArray.includes(item.metadata["oai_dc:dc"]["dc:type"]) ){
          educ = item.metadata["oai_dc:dc"]["dc:type"];
        }
      }


      if (url2 !== null && educ!== null) {

      }

    }
  }
}

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms)
    })
}

// Function to get the length of the resource
async function FindLength(url, destination,flnm){
  var check = true;
  var numPages;
  var options = {
    directory: destination,
    filename: flnm
  }
  console.log("Destination: ", destination+flnm);
  // Download Pdf
  await download(url, options, async function(error){
    if (error) throw error;
    await sleep(200);
    let dataBuffer = await fs.readFileSync(destination+flnm);
    // Find out the number of pages
    await pdf(dataBuffer).then(function(data){
      console.log("Number of pages: ", data.numpages);
      numPages = data.numpages;
    })
    .catch(function(err){
      console.log("Error: ",err);
      numPages = null;
    });
  });
  await sleep(1000);
  return await numPages;
}


async function main () {
  // Use tudelft link to access metadata for harvesting with OAI protocol
  const oaiPmh = new OaiPmh(url);
  const identifierIterator = oaiPmh.listRecords({
    metadataPrefix: 'oai_dc',
  });

  var b = await FindLength("https://repository.tudelft.nl/islandora/object/uuid:bb4aec96-0555-4903-9c52-e692ab5ed146/datastream/OBJ/download","C:/tmp/","myFile"+".pdf");
  await console.log(b);
  // Loop to go through all the resources of tudelft one by one
  //for await (const identifier of identifierIterator) {
  //  try {
  //    getMetadata(identifier, i);
  //    if (i>2) break;
  //  }
  //  catch(error){
  //    console.log("Error: ",error);
  //  }
  //}
  // Print the number of resources we accessed for their properties
  //console.log(i);
}

main().catch(console.error);
