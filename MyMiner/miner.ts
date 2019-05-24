import { Observable } from '@reactivex/rxjs';
import { Doc } from 'feedbackfruits-knowledge-engine';
import { OaiPmh } from 'oai-pmh'

const url = `http://oai.tudelft.nl/ir`;
var i = 0;
var myArray = ['master thesis', 'bachelor thesis', 'doctoral thesis', 'journal article','review','conference paper','book','book chapter','public lecture'];

export function mine(): Observable<Doc> {
  return new Observable(observer => {
    try {
      const oaiPmh = new OaiPmh(url);
      console.log(Object.keys(oaiPmh), OaiPmh);
      const recordIterator = oaiPmh.listRecords({
        metadataPrefix: 'oai_dc',
      });

      (async () => {
        for await (const record of recordIterator) {
          if (i > 4) break;
          //console.log(record);
          const resource = mapRecord(record);
          // Only send the record that can successfully be mapped to resources
          if (resource != null) observer.next(resource);
        }
        observer.complete();
      })()
    } catch(e) {
      observer.error(e);
    }
  });
}

// Function to calculate the number of topics
function CalculateNumberOfTopics(item){
  // Number of topics
      if (Array.isArray(item.metadata["oai_dc:dc"]["dc:subject"])){
        return item.metadata["oai_dc:dc"]["dc:subject"].length;
      }
      else if (item.metadata["oai_dc:dc"]["dc:subject"] === undefined){
        return null;
      }
      else if ( item.metadata["oai_dc:dc"]["dc:subject"].includes(",") ){
        return item.metadata["oai_dc:dc"]["dc:subject"].split(",").length;
      }
      else if ( item.metadata["oai_dc:dc"]["dc:subject"].includes("/") ){
        return item.metadata["oai_dc:dc"]["dc:subject"].split("/").length;
      }
      else if ( item.metadata["oai_dc:dc"]["dc:subject"].includes("·") ){
        return item.metadata["oai_dc:dc"]["dc:subject"].split("·").length;
      }
      else if ( item.metadata["oai_dc:dc"]["dc:subject"].includes(";") ){
        return item.metadata["oai_dc:dc"]["dc:subject"].split(";").length;
      }
      else if ( item.metadata["oai_dc:dc"]["dc:subject"].toLowerCase().includes("oa-fund") || item.metadata["oai_dc:dc"]["dc:subject"].toLowerCase().includes("library") ){
        return null;
      }
      else if ( item.metadata["oai_dc:dc"]["dc:subject"].includes(" ") ){
        return item.metadata["oai_dc:dc"]["dc:subject"].split(" ").length;
      }
      else{
        return 1;
      }
}


// Function to get the copyrights from an array
function GetRightsFromArray(record){
  var answer = "";
  for (var k = 0; k<record.metadata["oai_dc:dc"]["dc:rights"].length; k++){
    answer = (GetRightsFromString(record.metadata["oai_dc:dc"]["dc:rights"][k]) === null) ? answer : GetRightsFromString(record.metadata["oai_dc:dc"]["dc:rights"][k]) ;
  }
  return answer;
}

// Function to get copyrights from string
function GetRightsFromString(record){
  if ( record.includes("CC-BY-NC-ND") || record.includes("BY-NC-ND") || record.includes("BY NC ND") || record.includes("NonCommercial-NoDerivs") ){
    return "CC-BY-NC-ND";
  }
  else if ( record.includes("CC-BY-NC-SA") || record.includes("BY-NC-SA") || record.includes("BY NC SA") || record.toLowerCase().includes("NonCommercial-ShareAlike") || record.toLowerCase().includes("noncommercial share alike") || record.toLowerCase().includes("non-commercial share alike") ){
    return "CC-BY-NC-SA";
  }
  else if ( record.includes("CC-BY-NC") || record.includes("BY-NC") || record.includes("BY NC") || record.toLowerCase().includes("noncommercial") || record.toLowerCase().includes("non commercial") || record.toLowerCase().includes("non-commercial")){
    return "CC-BY-NC";
  }
  else if ( record.includes("CC-BY-ND") || record.includes("BY-ND") || record.includes("BY ND") || record.includes("by-nd") ){
    return "CC-BY-ND";
  }
  else if ( record.includes("CC-BY-SA") || record.includes("BY-SA") || record.includes("BY SA") ){
    return "CC-BY-SA";
  }
  else if ( record.includes("CC-BY") || record.includes("BY") || record.includes("/by") || record.toLowerCase().includes("creative commons 3.0") || record.toLowerCase().includes("license 4.0") || record.toLowerCase().includes("attribution 3.0") || record.toLowerCase().includes("attribution 4.0") || record.toLowerCase().includes("provided the original work is properly cited") || record.toLowerCase().includes("permits unrestricted use, distribution, and reproduction in any medium, provided") ){
    return "CC-BY";
  }
  else if ( record.includes("CC0") || record.includes("(c0)") ){
    return "CC0";
  }
  else if ( record.toLowerCase().includes("(c)") || record.toLowerCase().includes("©") ){
    return "C";
  }
  else{
    return null;
  }
}


// TODO: @Georgia: Expand this as needed to test data that is sent over the bus contains all the required properties.
// Try commenting in the title below and see how the test fails after that and can be fixed by checking the title in the test.
// Then add all the other missing properties here and in the test to complete the miner.
function mapRecord(record) {
  if (!('metadata' in record && typeof record.metadata == 'object' && 'oai_dc:dc' in record.metadata)) return null;
  var numOfTopics, uid, urlDownload, rights, creatDate;
  var educationalLevel = null;
  var id = null;
  // Map only english resources
  if (record.metadata["oai_dc:dc"]["dc:language"] === "en"){

    //Check if resource url exists and create new download url
    if (record.metadata["oai_dc:dc"]["dc:identifier"] === undefined){
      id = null;
    }
    else if (Array.isArray(record.metadata["oai_dc:dc"]["dc:identifier"])){
      for (var j=0; j<(record.metadata["oai_dc:dc"]["dc:identifier"]).length; j++){
        if (record.metadata["oai_dc:dc"]["dc:identifier"][j].includes("http")) {
          id = record.metadata["oai_dc:dc"]["dc:identifier"][j];
          uid = (id.split("nl/"))[1];
          urlDownload = "https://repository.tudelft.nl/islandora/object/"+uid+"/datastream/OBJ/download";
        }
      }
    }
    else{
      id = record.metadata["oai_dc:dc"]["dc:identifier"];
      uid = (id.split("nl/"))[1];
      urlDownload = "https://repository.tudelft.nl/islandora/object/"+uid+"/datastream/OBJ/download";
    }

    // Checking the type of resource
    if (id !== null){
      if ( Array.isArray(record.metadata["oai_dc:dc"]["dc:type"]) ){
        if ( myArray.includes(record.metadata["oai_dc:dc"]["dc:type"][0]) ){
          educationalLevel = record.metadata["oai_dc:dc"]["dc:type"][0];
        }
      }
      else if (record.metadata["oai_dc:dc"]["dc:type"] === undefined){
        educationalLevel = null;
      }
      else if ( myArray.includes(record.metadata["oai_dc:dc"]["dc:type"]) ){
        educationalLevel = record.metadata["oai_dc:dc"]["dc:type"];
      }
    }


    // If the resource is in english, a url for it exists and it is of a specific type
    if ( id !== null && educationalLevel !== null){
      console.log("Resource: ", i);
       i++;
       // Getting the number of topics
       numOfTopics = CalculateNumberOfTopics(record);

       // Find copyright license
       if (record.metadata["oai_dc:dc"]["dc:rights"] !== undefined){
          if ( Array.isArray(record.metadata["oai_dc:dc"]["dc:rights"]) ){
            rights = GetRightsFromArray(record);
          }
          else{
            rights = GetRightsFromString(record.metadata["oai_dc:dc"]["dc:rights"]);
          }
        }
        else if (record.metadata["oai_dc:dc"]["dc:rights"] === undefined){
          rights = null;
        }

        // Find creation date
        if (record.metadata["oai_dc:dc"]["dc:date"] === undefined){
            creatDate = null;
        }
        else if ( Array.isArray(record.metadata["oai_dc:dc"]["dc:date"]) ){
          creatDate = record.metadata["oai_dc:dc"]["dc:date"][0];
        }
        else{
          creatDate = record.metadata["oai_dc:dc"]["dc:date"];
        }

       return {
         "@id": id, //[].concat(record.metadata["oai_dc:dc"]["dc:identifier"]).slice(-1)[0], // This hackyness is because the identifier is sometimes an array
         "@type": [
           "Resource", "Document"
         ],
         "title": (record.metadata["oai_dc:dc"]["dc:title"] === undefined) ? null : record.metadata["oai_dc:dc"]["dc:title"],
         "language": record.metadata["oai_dc:dc"]["dc:language"],
         "copyrights": rights,
         "abstract": (record.metadata["oai_dc:dc"]["dc:description"] === undefined) ? null : record.metadata["oai_dc:dc"]["dc:description"],
         "author": (record.metadata["oai_dc:dc"]["dc:creator"] === undefined) ? null : record.metadata["oai_dc:dc"]["dc:creator"],
         "organization": "Delf University of Technology",
         "contributors": (record.metadata["oai_dc:dc"]["dc:contributor"] === undefined) ? null : record.metadata["oai_dc:dc"]["dc:contributor"],
         "subject topics": (record.metadata["oai_dc:dc"]["dc:subject"] === undefined) ? null :record.metadata["oai_dc:dc"]["dc:subject"],
         "Number of topics": numOfTopics,
         "Educational Level" : educationalLevel,
         "url for download" : urlDownload,
         "Creation Date" : creatDate,
       };
     }
  }
  else{
    return null;
  }
}
