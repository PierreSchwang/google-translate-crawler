import express from 'express';
import {IndexPostRoute} from "./routes/IndexPostRoute";
import bodyParser from 'body-parser';
import GoogleTranslateCrawler from "../GoogleTranslateCrawler";

export default class HttpServer {

    private readonly server: express.Express;
    private readonly port: number;
    private readonly host: string;

    private readonly application: GoogleTranslateCrawler;

    constructor(application: GoogleTranslateCrawler) {
        this.application = application;

        this.port = Number(process.env.HTTP_PORT) || 8080;
        this.host = process.env.HTTP_HOST || '0.0.0.0';
        this.server = express();
        this.injectLogger();
        this.injectBodyParser();
        this.registerRoutes();
        this.bind();
    }

    public bind(): void {
        this.server.listen(this.port, this.host, () => {
            this.application.getLogger().info(`The http server is up and running on ${this.host}:${this.port}`)
        });
    }

    private registerRoutes() {
        this.server.post('/:lang', IndexPostRoute(this.application))
    }

    private injectLogger() {
        this.server.use(this.application.getLogger().getExpressLogger());
    }

    private injectBodyParser() {
        this.server.use(bodyParser.raw({
            type: [
                'text/plain',
            ]
        }));
    }
}
