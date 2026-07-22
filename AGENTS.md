What's done: I've already taken the liberty to export all the web content along with it's languages. I also already have them sorted between their location in Liferay Learn. I have them here in this repo I've created, inside of the output folder because I wasn't sure if I should already be putting them in liferay-learn.

All the Web Content content is stored inside the contentFields[].contentFieldValue.data field and it contains an HTML string. Depending on the location in Learn, we'll need to transform this HTML to MD or simply another JSON format to post into the KB Object.

There are four sub-folders inside of the /output folder:

/course
The content here will be migrated to this Confluence page. 
Only the text content is needed — not the HTML structure. Style, Format, Font, etc... none of that matters. This content gets fed to Claude by the Enablement Team so visuals really don't matter.

/docs
The content here will be migrated to to liferay-learn repo under a new folder at the base of the directory called /customer-portal
Docs need to be transformed into MD. You can probably have Claude make a rough translation and AFAIK that's enough for the Enablement team to take over.

/knowledge-base
 The content under the knowledge-base folder will be stored inside the Knowledge Article object on Learn.
What's needed will be simply a field mapping from the current response inside the JSON files to the fields in the Knowledge Article object. We should be able to just grab the contentFields[].contentFieldValue.data and through it in the content field for the Object.
The TSV file cp-articles-to-learn.tsv shows a table we can use to see which category each KB falls under. i.e Troubleshooting, Hot To, etc...

tbd - To be decided
The stuff under this folder didn't have a place defined for them yet. 
They'll most likely end up as docs, so maybe turning them to MD wouldn't be a bad thing.



/image will go here

Language
I've already fetched all the different languages for the files whenever there was a translation present.

Current file structured is /output/{content-type}/{folder-name}/{locale}/file-name.json e.g /output/knowledge-base/Administration/en/how-to-...-and-password.json

Images
I haven't had the time to think of the best way to export the images and upload them into D&M yet, but the images used inside these files as <img src="..."> still need to be exported out of support.liferay.com. From what I understand thus far, if it's a course, we don't need to export the image, if it's a doc we can store the image in the liferay-learn repo, and if it's KB it needs to be uploaded to D&M. We should also consider whether we'd have to change the src attribute where it's used.