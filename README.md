# tokyo-listings

This is a personal project I created to organize and archive listings for properties in Tokyo. It consists of a React frontend, a Node/Express server, and a custom Chrome extension.

In order for this project to run, you must:

1. Clone repo
2. Run tokyo-listings-bat-files\installAllModules.bat
    - Make sure to update dir path
3. Create tokyo-listings-frontend\\.env
    - Populate with REACT_APP_GOOGLE_MAPS_API_KEY and PORT
4. Create tokyo-listings-server\app\config\db.config.js
    - A template is given, see tokyo-listings-server\app\config\db.config.template.js
    - I used a an Amazon AWS PostgreSQL database
5. Run tokyo-listings-bat-files\runTokyoListings.bat
    - Make sure to update dir path

Here is a quick screenshot of the application:

![Tokyo Listings](http://puu.sh/IvTUA/8363cc9bb9.PNG)

Eventually, more detailed documentation will follow.
