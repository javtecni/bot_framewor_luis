// // // Copyright (c) Microsoft Corporation. All rights reserved.
// // // Licensed under the MIT License.

const fetch = require('node-fetch');

class FlightBookingRecognizer {
    constructor(config) {
        this.isConfigured = true;
        this.apiUrl = config.endpoint;
        this.language = config.language || 'en';
        this.apiKey = config.endpointKey;
    }

    async executeLuisQuery(context) {
        const text = context.activity.text;

        try {
            const projectName = "botLanguage";
            const deploymentName = "mydeployment";

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': this.apiKey
                },
                body: JSON.stringify({
                    kind: "Conversation",
                    analysisInput: {
                        conversationItem: {
                            id: "12345",
                            text: text,
                            modality: "text",
                            language: this.language,
                            participantId: "12345"
                        }
                    },
                    parameters: {
                        projectName,
                        verbose: true,
                        deploymentName,
                        stringIndexType: "TextElement_V8"
                    }
                })
            });

            const data = await response.json();

            const topIntent = (data.result?.prediction?.topIntent && typeof data.result?.prediction?.topIntent === 'string')
                ? data.result?.prediction?.topIntent
                : 'None';

            const entities = (data.result?.prediction?.entities && typeof data.result?.prediction?.entities === 'object')
                ? data.result?.prediction?.entities
                : {};

            const score = data.result?.prediction?.intents?.[topIntent]?.confidenceScore || 0.99;

            return {
                text: text,
                intents: {
                    [topIntent]: { score: score },
                    None: { score: 0.01 } // fallback en caso de que topIntent no tenga suficiente score
                },
                entities: entities
            };
        } catch (error) {
            return { intent: 'None', entities: {} };
        }
    }


        getFromEntities(result) {
        let fromValue, fromAirportValue;
        if (result.entities.$instance.From) {
            fromValue = result.entities.$instance.From[0].text;
        }
        if (fromValue && result.entities.From[0].Airport) {
            fromAirportValue = result.entities.From[0].Airport[0][0];
        }

        return { from: fromValue, airport: fromAirportValue };
    }

    getToEntities(result) {
        let toValue, toAirportValue;
        if (result.entities.$instance.To) {
            toValue = result.entities.$instance.To[0].text;
        }
        if (toValue && result.entities.To[0].Airport) {
            toAirportValue = result.entities.To[0].Airport[0][0];
        }

        return { to: toValue, airport: toAirportValue };
    }

    /**
     * This value will be a TIMEX. And we are only interested in a Date so grab the first result and drop the Time part.
     * TIMEX is a format that represents DateTime expressions that include some ambiguity. e.g. missing a Year.
     */
    getTravelDate(result) {
        const datetimeEntity = result.entities.datetime;
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0].timex;
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.FlightBookingRecognizer = FlightBookingRecognizer;
