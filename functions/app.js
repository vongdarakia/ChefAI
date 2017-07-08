// Copyright 2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;
const functions = require('firebase-functions');
const fs = require('fs');

const NAME_ACTION = 'make_name';
const COLOR_ARGUMENT = 'color';
const NUMBER_ARGUMENT = 'number';
const INTENT_START_INSTRUCTION = 'recipe.start'
const ACTION_NEXT_INSTRUCTION = 'instruction.next'

let x = 1;
let state = {
    currInstruction: 0,
    currRecipe: 0,
    timeStarted: null
};

const recipes = [{
        "recipe_name" : "Spaghetti Squash",
        "ingredients" : [
        {
          "name" : "small spaghetti squash",
          "weight_unit" : "lbs",
          "weight_qty" : "2",
          "unit" : null,
          "unit_qty" : "1"
        },
        {
          "name" : "extra-virgin olive oil",
          "unit" : "tbsp",
          "unit_qty" : "3"
        },
        {
          "name" : "kosher salt",
          "unit" : "to taste",
          "unit_qty" : "1"
        },
        {
          "name" : "freshly ground salt",
          "unit" : "to taste",
          "unit_qty" : "1"
        },
        {
          "name" : "hot Italian sausage links",
          "weight_unit" : "lbs",
          "weight_qty" : "1.5",
          "unit" : "links",
          "unit_qty" : "8"
        },
        {
          "name" : "red bell pepper",
          "unit" : null,
          "unit_qty" : "1"
        },
        {
          "name" : "medium onion",
          "unit" : null,
          "unit_qty" : "1"
        },
        {
          "name" : "garlic",
          "unit" : "clove",
          "unit_qty" : "1 clove"
        },
        {
          "name" : "fresh parsley",
          "unit" : "cup",
          "unit_qty" : "1/4"
        },
        {
          "name" : "freshly grated parmesan",
          "unit" : "topping",
          "unit_qty" : "1"
        }
        ],
        "instructions" : [
        {
          "instruction" : "Halve squash lengthwise and scoop out the seeds",
          "duration" : null
        },
        {
          "instruction" : "In a large microwave-safe bowl, drizzle squash cut-side up with 1 tablesppon of olive oil and 1 tablespoon of water.",
          "duration": null
        },
        {
          "instruction" : "Season with salt and pepper.",
          "duration" : null
        },
        {
          "instruction" : "Cover tightly with plastic wrap and microwave until tender for about 20 minutes",
          "duration" : "20 minutes"
        },
        {
          "instruction" : "Heat the remaining 2 tablespoons of olive oik in a skillet over medium-high heat.",
          "duration" : null
        },
        {
          "instruction" : "Add the bell pepper, onion, and a teaspoon of salt and cook until softened - so about 5 minutes.",
          "duration" : null
        },
        {
          "instruction" : "Add the garlic and cook until the vegetables brown - so about 4 more minutes.",
          "duration" : null
        },
        {
          "instruction" : "Toss in the squash and parsely and season with salt and pepper.",
          "duration" : null
        },
        {
          "instruction" : "Serve with the sausages and sprinkle with parmesan",
          "duration" : null
        }
        ],
        "servings" : "4"
}];

// [START ChefAI]
exports.chefAI = functions.https.onRequest((request, response) => {
    const app = new App({request, response});
    
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    function makeName (app) {
        let number = app.getArgument(NUMBER_ARGUMENT);
        let color = app.getArgument(COLOR_ARGUMENT);
        app.tell('Hello, your silly name is ' +
        color + ' ' + number + '! ' + x++);
    }

    function test (app) {
        // let number = app.getArgument(NUMBER_ARGUMENT);
        // let color = app.getArgument(COLOR_ARGUMENT);
        app.tell('Bonjour! ' + x++);
    }


    function next (app) {
        if (!recipes[state.currRecipe]) {
            app.ask("Sorry, this recipe doesn't exist");
        }
        let instructions = recipes[state.currRecipe].instructions;
        state.currInstruction++;

        if (state.currInstruction === instructions.length - 1) {
            app.setContext("instructions-completed");
            app.ask("Lastly, " + instructions[state.currInstruction].instruction);
            state.currInstruction = 0;
        } else {
            app.setContext("instructing-recipe");
            app.ask(instructions[state.currInstruction].instruction);
        }
    }

    function startInstruction(app) {
        state.currInstruction = 0;
        app.setContext("instructing-recipe");
        app.ask("Okay first step is " + recipes[state.currRecipe].instructions[state.currInstruction].instruction);
    }

    let actionMap = new Map();
    actionMap.set(NAME_ACTION, makeName);
    actionMap.set(INTENT_START_INSTRUCTION, startInstruction);
    actionMap.set(ACTION_NEXT_INSTRUCTION, next);
    actionMap.set('test', test);

    app.handleRequest(actionMap);
});
// [END ChefAI]