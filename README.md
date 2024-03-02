# **Manga Bot**
## Description
Discord bot that uses pupeteer to scrape webpages

## Requirements
- node JS 20.11.0
- npm 10.2.4
- an application created in the discord developer portal


## How to Use
1. Download repo
2. Install all required modules using `npm install`
3. Fill out tokenSample.json with required info and rename it to token.json
4. create a `manga.db` file in data folder
5. Use `node .` in repo folder to start the bot

# **Change Logs**

## Change Log v0.1.8
- Added userCategories that the user can use to sort manga and show feed of just certain categories
- added option to not load icon when Fetching Manga data
- BiHourly refresh of all manga no longer fetches icon as well reducing time required. 
- added 5 minute timeout for fetching manga
- When updating current chapter using feed command icon is no longer updated
- getManga getMangaFull has option to not get icon
- added option in token to use global commands
- Fixed token import
- removed getManga function from myStats
- added descriptions to many of the functions
- updateManga refreshSelect now uses getManga function instead of its own
- updateManga now updates data instead of silently doing nothing
- updateManga now adds the time it updated to the db
- removed debug console logs
- changed discord JS version to be logged at start rather than once bot starts
- Added whitelist for getting manga chapters
- improved ability to block css and js when loading page
- added bidgear to blocklist



## Change Log v0.1.7
- fixed issue with bulk add command where it would reply that its done before it is
- Improved wording of initial reply of bulk command
- Created new command myStats that returns a card containing user statistics based on tracked manga
- Added new cardGenerator function to create User Statistics Card
- Created template for User statistics (not final version)
- changed update All function to wait until prior manga us updated rather than just waiting 4 seconds. This is to allow lower powered systems to not get overwhelmed 
- Moved token location to data folder


## Change Log v0.1.6
- added message for when user provides invalid URL in add command
- added message for when the user has no unread manga when using feed command
- Feed command now uses updates and editing message instead of sending a new one and deleting a old one
- Feed command collector now stops
- removed some unused variables
- removed temporary debugging console logs
- enabled bot updating stored manga every 2 hours
- updated bulk add command to use dedicated setupChaps function instead of its own
- changed allUnread command to use dedicated unread function instead of its own
- changed card command to use dedicated generate card function instead of its own
- removed unused imports
- switched puppeteer to be headless using the new version
- getFullManga function will wait till icon saving is complete to return results 

## Change Log v0.1.5
 
- Fixxed bug where nothing would appear when you got to end of feed
- updates setupchaps to have next chap be latest if you are on the latest chapter
- added reply for when bot added manga using add command
- switched from using addOption to setOption in mark as read list for feed command resolving a crash
- removed debug logs in feed command
- Fixxed get unread function to last unread
- Added forgetme command that removes data that tracks the users data

## Change Log v0.1.4

- moved data folder from src to the base directory
- removed unnecessary print statements and commented out debugging print statements
- Changed most of bots responses to only be visible by command sender
- Fixxed allUnread command description in index.js to match what the command does
- split cardGenerator function into its own file
- created a new command called "feed" in which uses cards and interactive buttons to show you a list of unread manga
- upgraded Discord.JS version
- reduced amount of information logged making the console easier to read
-  converted commands to use dedicated get all manga function to get Manga instead of their own
- moved card generator function to its own file
- updated where icons are soved to to new location

## Change Log v0.1.3

- changed allUnread to send masked link
- switched most commands to only show command sender the reply
- All unread command now first sends user a message with the current time and date - to help seperate old and new links
- prevented links bot sends with allUnread from embedding
- changes autocomplete to use fuse.js resulting in better recomendations. 
- updated ReadMe to include changelog, requirments, and instructions. 
- updated project file structure

## Change Log v0.1.2

- added update time to the card
- rounded edges of icon on card improving its look
- updated bulkadd to use getMangaFull function instead of its own
- resolved crash that would occure when the next button isnt on page
- reduced timeout time for looking for next button to 10 miliseconds
- improved code limiting how many getManga can run at once. 
- changed allUnread command to send links in DM rather than channel command was run in
- changed bulkAdd and allUnread to respond where only the command sender can see it

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
