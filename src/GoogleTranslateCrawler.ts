import Logger from "./logging/Logger";
import HttpServer from "./server/HttpServer";
import TypedPool from "./lib/TypedPool";
import ITranslationCrawler from "./crawler/ITranslationCrawler";
import GoogleTranslationCrawler from "./crawler/GoogleTranslationCrawler";

export default class GoogleTranslateCrawler {

    private readonly logger: Logger;
    private http: HttpServer | undefined;
    private readonly translators: TypedPool<ITranslationCrawler>;

    constructor() {
        this.logger = new Logger();
        this.logger.debug('Using debug log level');
        this.translators = new TypedPool<ITranslationCrawler>(this.translatorFactory(), 2, 10, () => {
            this.http = new HttpServer(this);
        })
    }

    public getTranslators(): TypedPool<ITranslationCrawler> {
        return this.translators;
    }

    public getLogger(): Logger {
        return this.logger;
    }

    private translatorFactory() {
        return () => new Promise<GoogleTranslationCrawler>(async (resolve, reject) => {
            const crawler = new GoogleTranslationCrawler(this);
            await crawler.buildBrowser();
            resolve(crawler);
        });
    }
}
