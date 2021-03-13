import {Handler} from 'express';
import GoogleTranslateCrawler from "../../GoogleTranslateCrawler";

export const IndexPostRoute = (application: GoogleTranslateCrawler): Handler => {

    return async (req, res) => {
        if (!req.body) {
            return res.status(400).send('Missing payload (body)!');
        }

        try {
            const translator = await application.getTranslators().acquire();
            const result = await translator.translate(
                application,
                (req.body as Buffer).toString('utf-8'),
                req.params.lang
            );
            application.getTranslators().release(translator);
            res.type('text/plain').status(200).send(result);
        } catch (e) {
            res.status(400)
                .type('text/plain')
                .send(e);
        }

    }

}
