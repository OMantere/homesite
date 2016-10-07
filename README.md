
# Home site

Hi, this is the repo for my personal site. Feel free to browse around and re-use anything you might find useful.


## Aalto WebOodi Calendar Tool

The course system at Aalto University had no way to export timetables to any external calendar, and the built-in system
sucked. So i made this little tool that allows exporting of everything to Google Calendar. The scraping "app" which does the actual fetching of course data can be found in the folder ```scrape-oodi```. 


#####Locations

The tool contains a list of all the addresses of the buildings at the campus which it uses to translate the cryptic
numeric codes(which WebOodi displays by default)into human-readable addresses. This also allows leveraging Google Maps
to get directions from Calendar seamlessly. Finally, it parses the event's class name from WebOodi and appends it to the
event summary in Calendar.

The list is in JSON and is free for all to use, the endpoint is GET https://oskarimantere.com/assets/osoitteet.json.
