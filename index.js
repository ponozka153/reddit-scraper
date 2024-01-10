const axios = require("axios");
const request = require("request")
const cheerio = require("cheerio");

const imgur = require('imgur');

const client = new imgur.ImgurClient({ clientId: "d2a2d4b31d52eae" });

const fs = require("fs");

var settings = ""

if (fs.readdirSync("./").includes("settings.json")) {

    settings = JSON.parse(fs.readFileSync("./settings.json"))

} else {

    let settingsJSON = JSON.stringify({
        "Sorting": "hot",
        "_koument.Sorting :D": "Sorting může být new/hot/top. Top sorting je na today",
        "DoSaidSubreddits": false,
        "_koument.DSS&Subreddits": "DoSaidSubreddits znamená že po zapnutí to automaticky vezme posty z subreddits tich co jsou napsané v Subreddits",
        "Subreddits": [
            "sus",
            "amogus",
            "valve",
            "fortnite"
        ],
        "ShowSettingsLog": true,
        "_koument.SSL :D": "ShowSettingsLog znamená že to po zapnutí ukáže vaše nastavení.",
    }, 0, 4)

    fs.writeFileSync("./settings.json", settingsJSON)
    settings = JSON.parse(fs.readFileSync("./settings.json"))

}


const colors = require("colors")

const prompt = require("prompt-sync")()

const Parser = require("rss-parser");
const parser = new Parser();

console.log("Welcum, this Reddit scraper will scrape maximally 25 photos/videos from the subreddit, protože reddit je kkt a má to locklý na 25 max myslim, btw sort je na hot.".bgMagenta)
console.log("Momentálně to bere jen obrázky/gify/videa když to je nějakej shit co reddit pojme jako gif i když to je video\nJestli to někdy dodělám nvm protože reddit to savuje v kokotským file typu ty videa xdd\nLike wtf is m3u8 man.".red)
console.log("----------------------------------------------".grey)

if(settings.ShowSettingsLog === true){
console.log("NASTAVENÍ:".gray.bold)
console.log(`Sorting: ${settings.Sorting}`.gray)
console.log(`DoSaidSubreddit: ${settings.DoSaidSubreddits}`.gray)
console.log(`Subreddits: ${settings.Subreddits}`.gray)
console.log("----------------------------------------------".grey)
}

async function main(subreddit) {

    const feed = await parser.parseURL(`https://www.reddit.com/r/${subreddit}/${settings.Sorting}.rss`)

    console.log(`Receeivnul jsem ${feed.items.length} postů z `.yellow + `${subreddit}`.white.bold + `, scrapuju všechno co se dá stáhnout!`.yellow)

    var lastnum = feed.items.length
    var i = 0
    var post = 0

    feed.items.forEach(async e => {
        post++
        var $ = cheerio.load(e.content)
        var fileurl = $("table > tbody > tr > td:nth-child(2) > span:nth-child(3) > a").attr("href")
        if (fileurl !== undefined) {
            if (fileurl.includes("imgur")) {
                const album = await client.getAlbum(`${fileurl.replace("https://imgur.com/a/", "")}`);
                if (album.data.images_count === 1) {
                    if (album.images !== undefined) {
                        fileurl = album.data.images.link
                    }
                }
            }
            if (fileurl.includes("png") || fileurl.includes("jpg") || fileurl.includes("jpeg") || fileurl.includes("gif")) {
                if (fileurl.includes("redgifs")) {
                    url = "https://api.redgifs.com/v1/oembed?url="
                    fileurl = url + fileurl.replace(":", "%3A").replace(new RegExp("/", 'g'), "%2F")
                    await axios.get(fileurl).then(r => {
                        fileurl = r.data.thumbnail_url.replace("jpg", "mp4")
                    })
                }
                //console.log(e.title)
                //console.log(fileurl)
                if (!fs.readdirSync(".").includes(subreddit)) { fs.mkdirSync(subreddit) }

                var download = async function (uri, filename, i) {
                    request.head(uri, function (err, res, body) {
                        //console.log('content-type:', res.headers['content-type']);
                        //console.log('content-length:', res.headers['content-length']);
                        if (res.headers["content-type"].includes("image") || res.headers["content-type"].includes("video")) {
                            request(uri).pipe(fs.createWriteStream(`./${subreddit}/${filename}.${res.headers['content-type'].replace("video/", "").replace("image/", "")}`).on("error", err => { console.log(`${err}`.red.bold); fs.writeFileSync("error.txt", err) })).on("finish", () => { i }).on("error", err => { console.log(`${err}`.red.bold); fs.writeFileSync("error.txt", err) })
                        }
                    });
                };

                e.title = `${e.title.split("|")}`.split("/"); e.title = `${e.title}`.split("?"); e.title = `${e.title}`.split('"'); e.title = `${e.title}`.split("'"); e.title = `${e.title}`.split(":"); e.title = `${e.title}`.split("<"); e.title = `${e.title}`.split(">") //dávám do píči shity se kterýma se file nemůže jmenovat, sice jak úplnej kokot protože jsem to nikdy nedělal + neumim googlit asi tvl ale nevadí, když funguje tak funguje :D

                await download(fileurl, e.title, i++)//.finally(console.log(i))
            }
        }
        // console.log(i)
        // console.log(lastnum)
    });
    setTimeout(() => {
        if (post === lastnum) console.log(`Done! Scraplo se cca ${i} souborů z `.green + `${subreddit}`.white.bold + ` (Nebo jakoby ještě se to dostahovává, počkej až se to samo dropne xd)`.green)
    }, 1000);
}

if (settings.DoSaidSubreddits === true) {
    console.log(`Arbeituju na všem v ${settings.Subreddits} na sortingu "${settings.Sorting}" 😎👌`)
    settings.Subreddits.forEach(subreddit => {
        main(subreddit)
    })
} else {
    var subreddit = prompt("Který subreddit? (bez r/): ".blue.bold)
    //var subreddit = ""
    main(subreddit)
}
