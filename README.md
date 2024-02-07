# **Manga Bot**
Discord bot that uses pupeteer to scrape webpages

## Requirements
- node JS 20.11.0 or greater
- npm 10.2.4 or greater
- an application created in the discord developer portal


## How to Use
1. Download repo
2. Install all required modules using npm
3. Fill out tokenSample.json with required info and rename it to token.json
4. create a manga.db file in data folder
5. Use `node .` in repo folder to start the bot

# **Change Logs**

## Change Log v0.1.1

- added updated time to manga database
- fixxed add ccommand not using the getManga funcion
- updated getManga function to get needed data
- fixed images not saving to propper location that caused program crash on card - generation
- added data structure to repo
- commented out some test code
- added more test code and print statements
- added defferReply to add command so it doesnt time out
- fixed index of commands to include all commands in manga command group
- fixxed some formattting in index of manga command group


## Change Log v0.1.2

- added update time to the card
- rounded edges of icon on card improving its look
- updated bulkadd to use getMangaFull function instead of its own
- resolved crash that would occure when the next button isnt on page
- reduced timeout time for looking for next button to 10 miliseconds
- improved code limiting how many getManga can run at once. 
- changed allUnread command to send links in DM rather than channel command was run in
- changed bulkAdd and allUnread to respond where only the command sender can see it


## Change Log v0.1.3

- changed allUnread to send masked link
- switched most commands to only show command sender the reply
- All unread command now first sends user a message with the current time and date - to help seperate old and new links
- prevented links bot sends with allUnread from embedding
- changes autocomplete to use fuse.js resulting in better recomendations. 
- updated ReadMe to include changelog, requirments, and instructions. 
- updated project file structure