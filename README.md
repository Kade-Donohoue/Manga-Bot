# **Manga Bot**
## Description
Discord bot that uses Puppeteer to scrape web pages. 

## Requirements
- node JS 20.11.0
- npm 10.2.4
- an application created in the Discord developer portal


## How to Use
1. Download repo
2. Install all required modules using `npm install`
3. Fill out `tokenSample.json` with the required info and rename it to `token.json`
4. Check out `config.json` and change to your liking
5. Create a `manga.db` file in the data folder
6. Use `node .` in the repo folder to start the bot

## To-Do List
- Add activity support
- support more websites
- reduce duplicated code (ex: getManga.setupChaps)

# Config

## token.json
- code: Token of bot. Found under the bot section of the discord developer portal. You may have to reset the token to get it
- public: Public Key of the discord bot. This can be found under general information of Discord developer portal
- appID: Application ID of the discord bot. This can be found under general information of Discord developer portal
- guildID: ID of your test discord server

## config.json
- globalCommands: (default: false) Have commands as global (anywhere the bot is including DMs) or just the provided guildID
- updateDelay: (default: 7200000) Delay in milliseconds between updating all manga stored in DB
- updateAtStart: (default: true) whether or not all manga should be updated when started
- allowManganatoScans: (default: true) Enable or disable the ability to add or update Manganato
- allowReaperScans: (default: false) Enable or disable the ability to add or update Reaper Scans(protected by cloudflare)
- allowReaperScansFake: (default: true) Enable or disable the ability to add or update Reaper-Scans(May work better for scraping and contains same content)
- forceUpdateCurrentText: (default: false) Enables or disables force update of all current card text on the bot start 

# **Change Logs**

## Change Log v0.1.15
- added support for reaper-scans
- when you provided a proper url to bulk add that isn't one that bot supports it will now give proper error message instead of freezing 
- switched category to be before url in add and bulk add
- reworked nextList generation to support reaper-scans
- changed how rebuilding chapter URL works simplifying it
- reworked updating next card to work with reaper-scans

## Change Log v0.1.14
- added a counter for where you are at in the feed (ex: 4 / 9 Unread Manga)

## Change Log v0.1.14
- commented out console log-in feed command that was outputting mark as read key, values
- refreshAll now has the option to also update the next card text allowing it to be accurate when the user is already at the latest
- added option in config to force update current card text in case it got messed up
- Read Me now also shows the default config.json values

## Change Log v0.1.13
- feed command no longer sets the category of manga to unsorted when updating the chapter
- added option in config.js to enable/disable updating all manga when the bot starts
- added support for Reaper Scans
- fixed issue where cards would display 1 extra chapter then there was
- removed commented-out code in generateUserStatCard that served no purpose
- changed how getNextList created the labels so it works with both Reaper and Manganato
- changed getNextList value to just be last part of URL instead of full url. This reduces the chance of the 100-char limit being reached for the value
- fixed some spelling throughout changelogs
- feed command will now send the user an error message when saving the updated chapter fails
- bulkadd loop has been rebuilt to not be recursive
- more accurate errors for bulkadd have been added
- option in config.js has been added to disable Reaper Scans
- option in config.js has been added to disable ChapManganato

## Change Log v0.1.12
- feed command now updates interact time when you click the next button to leave the current manga instead of when the current one is loaded
- feed command doesn't update interact time when you press back anymore
- moved feedCardMaker outside of mangaCardHandler
- renamed userDataUtils over to dataUtils to better reflect its intended purpose
- fixed feed command mark as read-only giving the latest chapter as an option
- when registering slash commands it will also set global or guild commands to blank depending on the config
- instead of using a delay function collectors timeout is used and when it ends it changes interaction to reflect as such
- feedCardMaker now directly uses dictionary values instead of assigning them to constants
- moved getNextList command into dataUtils file
- resolved link button opening the wrong link when another person used the feed command as you were looking at a card
- added a message when an error occurs when using the add command
- changed how current Chapter text for cards is obtained (splices URL instead of pulling from dropdown) as on occasion it would get the text incorrect
- commented out success saving icon log
- changed wording of confirmation of slash commands being registered

## Change Log v0.1.11
- Added interactionTime to userData table
- options.get('category) have been replaced with getString and a default value of unsorted was added
- card, current, feed, next, and getManga update interactionTime to current time
- created userDataUtils which currently has function for updating interaction time
- updateCategory now has default category set as unsorted
- setUpChaps default category is now unsorted
- using LIKE with wildcards in sql statement instead of a if else tree simplifying code
- added sortMethod for feed command allowing user to select between sorting by name or interaction time (default is interaction time)
- added sortOrder for feed command allowing user to select between sorting from ascending and descending order

## Change Log v0.1.10
- added updateCategory to export list of updateManga file
- added response when changing the category
- Please wait message when selecting chapter you read to in feed command now appears before it tries updating
- Changed feed command timeout to 14.5 minutes
- Removed globalCommands option from token.json
- Added descriptions for config and token in readme
- replace manageCard function with mangaCardHandler and feedCardMaker
- feed card maker creates message content for feed command
- mangaCardHandler isn't recursive like mangaCard making function easier to understand and overall improved
- any time a button is pressed the please wait message appears
- removed unused import os sql from index.js
- feed command timeout now mentions feed command

## Change Log v0.1.9
- replaced all instances of interaction.member to interaction.user allowing for commands to be run in DMs
- made category required option in bulk add command
- Added a 10 minute timeout to feed command
- added back button to read selection menu of feed command
- Moved global Command setting to config.json
- added option in config.json to change update delay (set to 2 hours by default)
- globalCommands is now false by default
- changed layout of buttons for feed command
- added option to change mangaCategory from feed command
- added hold as option to all category options where it was missing before
- changed puppeteer back to being headless

## Change Log v0.1.8 (HotFix)
- change puppeteer back to be headless
- fixed tokenSample.json with new data

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
- added bidgear to blacklist



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
 
- Fixed bug where nothing would appear when you got to end of feed
- updates setupchaps to have next chap be latest if you are on the latest chapter
- added reply for when bot added manga using add command
- switched from using addOption to setOption in mark as read list for feed command resolving a crash
- removed debug logs in feed command
- Fixed get unread function to last unread
- Added forgetme command that removes data that tracks the users data

## Change Log v0.1.4

- moved data folder from src to the base directory
- removed unnecessary print statements and commented out debugging print statements
- Changed most of bots responses to only be visible by command sender
- Fixed allUnread command description in index.js to match what the command does
- split cardGenerator function into its own file
- created a new command called "feed" in which uses cards and interactive buttons to show you a list of unread manga
- upgraded Discord.JS version
- reduced amount of information logged making the console easier to read
-  converted commands to use dedicated get all manga function to get Manga instead of their own
- moved card generator function to its own file
- updated where icons are saved to to new location

## Change Log v0.1.3

- changed allUnread to send masked link
- switched most commands to only show command sender the reply
- All unread command now first sends user a message with the current time and date - to help separate old and new links
- prevented links bot sends with allUnread from embedding
- changes autocomplete to use fuse.js resulting in better recommendations. 
- updated ReadMe to include changelog, requirements, and instructions. 
- updated project file structure

## Change Log v0.1.2

- added update time to the card
- rounded edges of icon on card improving its look
- updated bulkadd to use getMangaFull function instead of its own
- resolved crash that would occur when the next button isn't on page
- reduced timeout time for looking for next button to 10 milliseconds
- improved code limiting how many getManga can run at once. 
- changed allUnread command to send links in DM rather than channel command was run in
- changed bulkAdd and allUnread to respond where only the command sender can see it

## Change Log v0.1.1

- added updated time to manga database
- fixed add command not using the getManga function
- updated getManga function to get needed data
- fixed images not saving to proper location that caused program crash on card - generation
- added data structure to repo
- commented out some test code
- added more test code and print statements
- added defferReply to add command so it doesn't time out
- fixed index of commands to include all commands in manga command group
- fixed some formatting in index of manga command group
