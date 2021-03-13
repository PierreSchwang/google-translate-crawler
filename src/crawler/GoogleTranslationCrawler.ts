import ITranslationCrawler from "./ITranslationCrawler";
import GoogleTranslateCrawler from "../GoogleTranslateCrawler";
import {Browser, launch, Page} from "puppeteer";

export default class GoogleTranslationCrawler implements ITranslationCrawler {

    private browser: Browser | undefined;
    private application: GoogleTranslateCrawler;

    constructor(application: GoogleTranslateCrawler) {
        this.application = application;
    }

    public async buildBrowser() {
        const start = new Date().getMilliseconds();
        this.browser = await launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--lang=de-DE,de'
            ]
        });
        this.application.getLogger().debug(`Took ${
            new Date().getMilliseconds() - start
        }ms to start GoogleTranslationCrawler instance`);
    }

    translate(application: GoogleTranslateCrawler, toTranslate: string, targetLang: string): Promise<String> {
        return new Promise<String>(async (resolve, reject) => {
            if (!this.browser) {
                application.getLogger().error("Broken GoogleTranslateCrawler - Browser instance is null!")
                return reject("Failed to translate - NULL");
            }

            let page: Page;

            try {
                page = await this.browser.newPage();
                await page.goto(`https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(toTranslate)}&op=translate`);
                await page.waitForSelector('[data-loadingmessage="Übersetzung wird abgerufen…"]', {
                    hidden: true
                })
                const response = page.$eval("body", (element) => {
                    const searchTerm = 'Übersetzungsergebnisse';

                    return new Promise<string>((resolve, reject) => {
                        let outputTitle = [...document.querySelectorAll("h2")]
                            .find(a => a && a.textContent && a.textContent.includes(searchTerm));
                        if (!outputTitle) {
                            return reject('Parent container not found [TITLE]');
                        }
                        const outputParentContainer = (outputTitle as HTMLHeadingElement).parentElement;
                        if (!outputParentContainer) {
                            return reject('Parent container not found [PARENT NODE]');
                        }
                        for (const child of outputParentContainer.children) {
                            if (!child)
                                continue;
                            const attr = child.getAttribute('jsaction');
                            if (!attr)
                                continue;
                            if (!(attr.indexOf('copy:') > -1))
                                continue;
                            const textContainers = child.children
                                .item(0)?.children
                                .item(0)?.children
                                .item(0)?.children;
                            if (!textContainers) {
                                return reject('textContainers not found');
                            }
                            let result = "";
                            for (const container of textContainers) {
                                result += container.children[0].textContent + " ";
                            }
                            resolve(result.substr(0, result.length - 1));
                        }
                    });
                });
                response.catch(reason => {
                    application.getLogger().error('Failed to translate')
                    application.getLogger().error(reason);
                    reject('Couldn\'t evaluate google translate')
                }).then(value => {
                    resolve(value as string);
                }).finally(() => {
                    if (page) {
                        page.close();
                    }
                });
            } catch (e) {
                application.getLogger().error(e);
                reject(e);
            }
        });
    }

}
