import GoogleTranslateCrawler from "../GoogleTranslateCrawler";

export default interface ITranslationCrawler {

    translate(application: GoogleTranslateCrawler, toTranslate: string, targetLang: string): Promise<String>;

}
