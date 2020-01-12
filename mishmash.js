//google voice number: (XXX) XXX-XXXX
const puppeteer = require("puppeteer");
const fs = require("fs");

MISHMASH();

async function MISHMASH() {
    console.log("status: MISHMASH running");
    const browser = await puppeteer.launch({
        headless: true,
        userDataDir: "chrome-profile"
    });
    const tab = await browser.newPage();
    var gameID = null;
    await tab.goto("https://voice.google.com/u/0/messages");
    console.log("status: google voice open, starting drive...");
    var i = 1;

    lobby();
    async function lobby() {
        console.log("status: lobby #" + i);
        var unreadMessage = await checkforUnread();
        if (unreadMessage) {
            var obj = await getMessage();
            var number = obj[1];
            var message = obj[2];
            console.log("status: new message from, " + number + ' "' + message + '"');

            // if (/host/i.test(message)) {
            //   gameID = getRandomInt(1000, 9999);
            //   var str1 =
            //     "Hello! You are now the HOST of a MISHMASH game. The Game ID is: " +
            //     gameID;
            //   var str2 = "What's your name?";
            //   console.log(
            //     "status: new MISHMASH game created with ID# " + gameID + "!"
            //   );
            //   await reply(str1);
            //   await tab.waitFor(1000);
            //   await replyToNumber(str2, number);
            // } else if (message == gameID) {
            //   var str1 = "Hello! You've joined a MISHMASH game. WHat's your name?";
            //   console.log("status: new player joined with number:" + number);
            //   await reply(str1);
            // } else {
            //   var str =
            //     "Hello! Please enter a valid game ID or 'HOST' to host your own MISHMASH game!";
            //   console.log("status: invalid command message recieved");
            //   await reply(str);
            // }
            i++;
            lobby();
        } else {
            i++;
            setTimeout(lobby, 500);
        }
    }
    async function exitLobby() {
        console.log("status: lobby #" + i);
        var mishMash = await getCompound();

        console.log("status: random mishMash:  " + mishMash[0] + "—" + mishMash[1]);
    }

    async function checkforUnread() {
        const unreadFlag = await tab.evaluate(() => {
            var unreadStatus = document.querySelector(
                "div[aria-label*='Unread. Message by']"
            );
            if (unreadStatus) {
                console.log("status: found an unread message!");
                return true;
            } else {
                return false;
            }
        });
        return unreadFlag;
    }
    async function getMessage() {
        const message = await tab.evaluate(() => {
            var unreadPreview = document
                .querySelector("div[aria-label*='Unread. Message by']")
                .getAttribute("aria-label");
            console.log("unreadPreview: " + unreadPreview);
            return unreadPreview;
        });
        var obj = /Unread. Message by ([^:]*):  (.+),.[a-zA-Z]+day+.+(AM|PM)/g.exec(
            message
        );
        return obj;
    }
    async function reply(str) {
        await tab.click("div[aria-label*='Unread. Message by']");
        await tab.waitFor(1000);
        await tab.click("textarea");
        await tab.keyboard.type(str);
        await tab.click("button[aria-label='Send message']");
        await tab.waitFor(1000);
        await tab.goto("https://voice.google.com/u/0/messages");
        console.log("status: reply sent!");
    }
    async function replyToNumber(str, number) {
        var numberClean = number.replace(/\D/g, "");
        var strClick = "div[gv-thread-id='t.+1" + numberClean + "']";
        await tab.click(strClick);
        await tab.waitFor(1000);
        await tab.click("textarea");
        await tab.keyboard.type(str);
        await tab.click("button[aria-label='Send message']");
        await tab.waitFor(1000);
        await tab.goto("https://voice.google.com/u/0/messages");
        console.log("status: reply sent!");
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (+max - +min) + +min);
    }

    async function getCompound() {
        var compound = main();
        async function main() {
            var data = await scrape(
                "https://www.enchantedlearning.com/wordlist/compoundwordscategorized.shtml",
                ".wordlist-item"
            );

            var compound = await randomCompound(data);
            var compoundArray = await splitCompound(compound);

            while (compoundArray == null) {
                var compound = await randomCompound(data);
                var compoundArray = await splitCompound(randomCompound);
            }
            console.log(compoundArray[0] + compoundArray[1]);
            return compoundArray;
        }
        async function scrape(url, str) {
            const browser = await puppeteer.launch({ headless: true });
            const tab = await browser.newPage();
            await tab.goto(url);
            const data = await tab.evaluate(str => {
                var dataList = document.querySelectorAll(str);
                var returnList = [];
                for (i = 0; i < dataList.length; i++) {
                    item = dataList[i].innerText.replace(/-/, "");
                    returnList.push(item);
                }
                return returnList;
            }, str);

            for (i = 0; i < data.length; i++) {
                //console.log(data[i]);
            }
            await browser.close();
            return data;
        }
        async function randomCompound(array) {
            function getRandomInt(max) {
                return Math.floor(Math.random() * Math.floor(max));
            }
            var randomAddress = getRandomInt(array.length);
            var compound = array[randomAddress];
            return compound;
        }
        async function splitCompound(compound) {
            //filter using wiktionary
            var url = "https://en.wiktionary.org/wiki/" + compound;
            var data = await scrape(url, "i.Latn.mention");
            if (data.length == 2) {
                return data;
            } else if (data.length > 2) {
                //filter using etymonline url
                var url2 = "https://www.etymonline.com/search?q=" + compound;
                var data2 = await scrape(url2, "span.crossreference");
                if (data2.length == 2) {
                    return data2;
                } else if (data2.length > 2) {
                    var data3 = [];
                    data3[0] = data2[0];
                    data3[1] = data2[1];
                    return data3;
                } else return null;
            } else return null;
        }
        return compound;
    }
}