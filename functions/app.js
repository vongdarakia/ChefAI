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

const SSML_SPEAK_START = '<speak>';
const SSML_SPEAK_END = '</speak>';
const RANDOM_AUDIO = '<audio src="https://freesound.org/data/previews/83/83979_1246963-lq.mp3"/>';

const NAME_ACTION = 'make_name';
const COLOR_ARGUMENT = 'color';
const NUMBER_ARGUMENT = 'number';
const FOOD_ARGUMENT = 'food';
const INTENT_START_INSTRUCTION = 'recipe.start';
const ACTION_NEXT_INSTRUCTION = 'instruction.next';
const ACTION_REPEAT_INSTRUCTION = 'instruction.repeat';
const ACTION_PREVIOUS_INSTRUCTION = 'instruction.previous';
const ACTION_CONTINUE_INSTRUCTION = 'instruction.continue';
const ACTION_GET_INGREDIENT = 'instruction.getIngredient';
const ACTION_GET_IMAGE = 'ingredient.getImage';
const ACTION_SUGGEST_RECIPE = 'recipe.suggestion';
const ACTION_SUGGESTION_FOLLOWUP_YES = 'recipesuggestion.recipesuggestion-yes';
const ACTION_SUGGESTION_FOLLOWUP_NO = 'recipesuggestion.recipesuggestion-no';
const ACTION_SUGGESTION_FOLLOWUP_FOOD = 'recipesuggestion.recipesuggestion-food';
const ACTION_SELECT_RECIPE = "select.recipe";
const CONTEXT_INSTRUCTING_RECIPE = 'instructing-recipe';
const CONTEXT_INSTRUCTIONS_COMPLETED = 'instructions-completed';
const CONTEXT_SELECTING_RECIPE = "selecting-recipe";
const CONTEXT_CHECKING_INGREDIENTS = "checking-ingredients";

let x = 1;
let initState = {
    currInstruction: 0,
    currRecipe: -1,
    timeStarted: null
};

let state = {
    currInstruction: 0,
    currRecipe: -1,
    timeStarted: null
};

let states = {};

const recipes = JSON.parse(require('fs').readFileSync('./recipes.json', 'utf8'));

// const recipes = [
//   {
//     "name" : "Spaghetti Squash",
//     "ingredients" : [
//       {
//         "name" : "small spaghetti squash",
//         "weight_unit" : "lbs",
//         "weight_qty" : "2",
//         "unit" : null,
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "extra-virgin olive oil",
//         "unit" : "tbsp",
//         "unit_qty" : "3"
//       },
//       {
//         "name" : "kosher salt",
//         "unit" : "to taste",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "freshly ground pepper",
//         "unit" : "to taste",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "hot Italian sausage links",
//         "weight_unit" : "lbs",
//         "weight_qty" : "1.5",
//         "unit" : "links",
//         "unit_qty" : "8"
//       },
//       {
//         "name" : "red bell pepper",
//         "unit" : null,
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "medium onion",
//         "unit" : null,
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "garlic",
//         "unit" : "clove",
//         "unit_qty" : "1 clove"
//       },
//       {
//         "name" : "fresh parsley",
//         "unit" : "cup",
//         "unit_qty" : "1/4"
//       },
//       {
//         "name" : "freshly grated parmesan",
//         "unit" : "topping",
//         "unit_qty" : "1"
//       }
//     ],
//     "instructions" : [
//       {
//         "instruction" : "halve the squash lengthwise and scoop out the seeds",
//         "duration" : null
//       },
//       {
//         "instruction" : "in a large microwave-safe bowl, with the squash cut-side up, drizzle 1 tablesppon of olive oil and 1 tablespoon of water then season with salt and pepper",
//         "duration": null
//       },
//       {
//         "instruction" : "cover the bowl tightly with plastic wrap and microwave until tender for about 20 minutes",
//         "duration" : "20"
//       },
//       {
//         "instruction" : "heat the remaining 2 tablespoons of olive oil in a skillet over medium-high heat",
//         "duration" : null
//       },
//       {
//         "instruction" : "add the bell pepper, onion, and a teaspoon of salt and cook until softened - so about 5 minutes",
//         "duration" : null
//       },
//       {
//         "instruction" : "throw in the garlic and cook until the vegetables brown which will take about 4 more minutes",
//         "duration" : null
//       },
//       {
//         "instruction" : "toss in the squash, parsely and season with salt and pepper",
//         "duration" : null
//       },
//       {
//         "instruction" : "serve with the sausages and sprinkle with parmesan",
//         "duration" : null
//       }
//     ],
//     "servings" : "4"
//   },
//   {
//     "name" : "Spanish Flan",
//     "ingredients" : [
//       {
//         "name" : "white sugar",
//         "unit" : "cup",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "eggs",
//         "unit" : null,
//         "unit_qty" : "3"
//       },
//       {
//         "name" : "sweetened condensed milk",
//         "weight_unit" : "oz",
//         "weight_qty" : "14",
//         "unit" : "can",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "evaporated milk",
//         "weight_unit" : "fl oz",
//         "weight_qty" : "12",
//         "unit" : "can",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "vanilla extract",
//         "unit" : "tbsp",
//         "unit_qty" : "1"
//       }
//       ],
//       "instructions" : [
//           {
//             "instruction" : "preheat your oven to 350 degrees",
//             "duration" : null
//           },
//           {
//             "instruction" : "melt the sugar until it's liquefied, in a medium saucepan over medium-low heat, and golden in color",
//             "duration" : null,
//             "img": {
//                   "name": "melted sugar",
//                   "url": "http://ethnicspoon.com/wp-content/uploads/2013/10/flan-sugar-melted.jpg"
//               }
//           },
//           {
//             "instruction" : "pour hot syrup into a 9 inch round glass baking dish, turning the dish to evenly coat the sides and bottom. Be careful because it's hot",
//             "duration" : null
//           },
//           {
//             "instruction" : "in a large bowl, beat in the following: eggs, condensed milk, evaporated milk and vanilla until it's smooth",
//             "duration" : null
//           },
//           {
//             "instruction" : "pour egg mixture into baking dish and cover with aluminum",
//             "duration" : null,
//             "img": {
//                   "name": "egg mixture",
//                   "url": "https://d1alt1wkdk73qo.cloudfront.net/images/guide/ec5b5eae760548f2968717e3d0837847/600x540_ac.jpg"
//               }
//           },
//           {
//             "instruction" : "bake in the preheated oven for 60 minutes. You did remember to preheat it, right?",
//             "duration" : null
//           },
//           {
//             "instruction" : "when baking is complete, invert onto the serving plate when the flan is completely cool",
//             "duration" : null,
//             "img": {
//                   "name": "oven flan",
//                   "url": "http://3.bp.blogspot.com/-yG519YCfGnM/TjFI2gZRxtI/AAAAAAAABJI/U7RBYub7my4/s1600/DSC05243.JPG"
//               }
//           }
//       ],
//       "servings" : "8",
//       "imgs" : [
//           {
//               "name": "melted sugar",
//               "url": "http://ethnicspoon.com/wp-content/uploads/2013/10/flan-sugar-melted.jpg"
//           },
//           {
//               "name": "egg mixture",
//               "url": "https://d1alt1wkdk73qo.cloudfront.net/images/guide/ec5b5eae760548f2968717e3d0837847/600x540_ac.jpg"
//           },
//           {
//               "name": "oven flan",
//               "url": "http://3.bp.blogspot.com/-yG519YCfGnM/TjFI2gZRxtI/AAAAAAAABJI/U7RBYub7my4/s1600/DSC05243.JPG"
//           }
//       ]
//   },
//   {
//     "name" : "Mashed Potatoes",
//     "ingredients" : [
//       {
//         "name" : "russet potatoes",
//         "weight_unit" : "lbs",
//         "weight_qty" : "3",
//         "unit" : null,
//         "unit_qty" : "8"
//       },
//       {
//         "name" : "salt",
//         "unit" : "tsp",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "butter",
//         "unit" : "tbsp",
//         "unit_qty" : "2"
//       },
//       {
//         "name" : "pepper",
//         "unit" : "to taste",
//         "unit_qty" : "1"
//       },
//       {
//         "name" : "hot milk",
//         "unit" : "cup",
//         "unit_qty" : "1/4"
//       }
//     ],
//     "instructions" : [
//       {
//         "instruction" : "place potatoes in a large saucepan and add water to cover said potatoes, then throw in 3/4 tsp of the salt and bring to a boil",
//         "duration" : null
//       },
//       {
//         "instruction" : "make sure heat is set to medium-low, loosely cover the saucepan and gently boil for 15 minutes or until the potatoes are soft enough to pierce with a fork",
//         "duration" : "15"
//       },
//       {
//         "instruction" : "drain the potatoes then return to the sauce pan. Oh, you may want to shake the saucepan gently over low heat for a couple minutes to evaporate any excess moisture",
//         "duration" : null
//       },
//       {
//         "instruction" : "afterwards, mash the potatoes until it is lump-free and add the margarine, salt and pepper",
//         "duration" : null
//       },
//       {
//         "instruction" : "continue mashing, adding milk as you go until the potatoes are at your desired level of smooth and creaminess. Be careful not to add too much milk because no one likes soupy mashed potatoes",
//         "duration" : null
//       },
//     ],
//     "servings" : "10"
//   }
// ];

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

    function checkRecipe() {
        if (state.currRecipe >= recipes.length || state.currRecipe < 0) {
            state.currRecipe = 0;
        }
    }

    function next(app) {
        checkRecipe();
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
            app.setContext(CONTEXT_INSTRUCTING_RECIPE);
            app.ask(instructions[state.currInstruction].instruction);
        }
    }

    function repeat(app) {
        checkRecipe();
        app.setContext(CONTEXT_INSTRUCTING_RECIPE);
        app.ask(recipes[state.currRecipe].instructions[state.currInstruction].instruction);
    }

    function previous(app) {
        checkRecipe();
        app.setContext(CONTEXT_INSTRUCTING_RECIPE);
        state.currInstruction--;
        if (state.currInstruction < 0) {
            state.currInstruction = 0;
        } 
        app.ask("The last task was, '" + recipes[state.currRecipe].instructions[state.currInstruction].instruction + "'");
    }

    function continueInstructions(app) {
        checkRecipe();
        app.setContext(CONTEXT_INSTRUCTING_RECIPE);
        app.ask(recipes[state.currRecipe].instructions[state.currInstruction].instruction);
    }

    function selectRecipe(app) {
        let food = app.getArgument(FOOD_ARGUMENT);

        if (food) {
            let exists = false;
            for (var i = recipes.length - 1; i >= 0; i--) {
                if (recipes[i].name.toLowerCase().indexOf(food.toLowerCase()) >= 0) {
                    state.currRecipe = i;
                    exists = true;
                    break ;
                }
            }
            if (exists) {
                // CHECK INGREDIENT!
                checkIngredients(app);
                // startInstruction(app);
            } else {
                app.setContext(CONTEXT_SELECTING_RECIPE);
                let msg = "That recipe doesn't exist at the moment. Here are some of your favorite recipes: ";
                for (var i = recipes.length - 1; i >= 0; i--) {
                    msg += recipes[i].name + ". ";
                }
                app.ask(msg);
            }
            
        } else {
            app.ask("No food selected");
        }
    }

    function startInstruction(app) {
        state.currInstruction = 0;
        app.setContext(CONTEXT_INSTRUCTING_RECIPE);
        app.ask("Okay first step is " + recipes[state.currRecipe].instructions[state.currInstruction].instruction);
    }

    function getIngredientFormat(ingredient) {
        if (ingredient.unit === null) {
            return (ingredient.unit_qty + " " + ingredient.name);
        } else if (ingredient.unit === "to taste") {
            return (ingredient.name + " to taste");
        }
        return (ingredient.unit_qty + " " + ingredient.unit + " of " + ingredient.name);
    }

    function getIngredient(app) {
        let ingredient = app.getArgument("ingredient");
        let ingredients = recipes[state.currRecipe].ingredients;

        app.setContext(CONTEXT_INSTRUCTING_RECIPE);
        if (ingredient) {
            for (var i = ingredients.length - 1; i >= 0; i--) {
                if (ingredients[i].name.toLowerCase().indexOf(ingredient.toLowerCase()) >= 0) {
                    app.ask(getIngredientFormat(ingredients[i]));
                    return;
                }
            }
            app.ask(ingredient + " is not in the list of recipes.");
        }
        else
            app.ask("?")
    }

    function getImage(app) {
        checkRecipe();
        let instruction = recipes[state.currRecipe].instructions[state.currInstruction];
        app.setContext(CONTEXT_INSTRUCTING_RECIPE);
        if (instruction.img) {
            if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
                let basicCard = app.buildBasicCard(recipes[state.currRecipe].imgs[0].name)
                    .setImage(recipes[state.currRecipe].imgs[0].url , recipes[state.currRecipe].imgs[0].name);

                let richResponse = app.buildRichResponse()
                    .addSimpleResponse("Here you go")
                    .addBasicCard(basicCard);
                ask(app, richResponse);
            } else {
                app.ask("Sorry, images can't be displayed on this device.");
            }
        } else {
            app.ask("Sorry, I don't have an image for that.");
        }
    }

    function suggestRecipe(app) {
        state.currRecipe++;

        let prompt = "Sorry, that was the last recipe. But the first one again is ";
        app.setContext(CONTEXT_SELECTING_RECIPE);
        if (state.currRecipe < recipes.length) {
            prompt = getRandomPrompt(app, ["How about ", "Want to try ", "Maybe "])
            + recipes[state.currRecipe].name + "?";
        } else {
            promp += recipes[state.currRecipe].name;
        }
        app.ask(prompt);
    }

    // function suggestionFollowupFood(app) {
    //     let food = app.getArgument("food");


    //     checkIngredients(app);
    // }

    function listRecipes() {
        let msg = "Here are some of your favorite recipes: ";
        app.setContext(CONTEXT_SELECTING_RECIPE);
        for (var i = recipes.length - 1; i >= 0; i--) {
            msg += recipes[i].name;
            if (i > 0) {
                msg += ", ";
            }
        }
        app.ask(msg);
    }

    function checkIngredients(app) {
        app.setContext(CONTEXT_CHECKING_INGREDIENTS);
        let msg = "Okay, do you have all of these ingredients? ";
        let ingredients = recipes[state.currRecipe].ingredients;
        for (var i = ingredients.length - 1; i >= 0; i--) {
            msg += getIngredientFormat(ingredients[i]);

            if (i > 0) {
                msg += ", \n";
            }
        }
        app.ask(msg);
    }

    function doPersist (persist) {
        if (persist === undefined || persist) {
          app.data.lastPrompt = app.data.printed;
        }
    }

    function ask (app, prompt, persist) {
        console.log('ask: ' + prompt);
        doPersist(persist);
        // app.ask(prompt, NO_INPUT_PROMPTS);
        app.ask(prompt);
    }

    function getRandomPrompt (app, array) {
        let lastPrompt = app.data.lastPrompt;
        let prompt;
        if (lastPrompt) {
            for (let index in array) {
                prompt = array[index];
                if (prompt !== lastPrompt) {
                    break;
                }
            }
        } else {
            prompt = array[Math.floor(Math.random() * (array.length))];
        }
        return prompt;
    }

    function testAudio(app) {
        let prompt = SSML_SPEAK_START + RANDOM_AUDIO + "Chris's audio" + SSML_SPEAK_END;
        app.ask(prompt);
    }

    function initialize(app) {
        state = Object.assign({}, initState);
        app.setContext('deciding-options');
        app.ask(getRandomPrompt(app, ["Rev up those fryers! What do you want to cook?",
            "Oh hey what's up? What recipe do you have in mind?",
            "I'm Marvin, I am here to help you cook, what do you have in mind?",
            "Hello, my name is Marvin! I am your personal chef! what do you want to cook?",
            "Oh hey, it's tiny chef! Wanna cook up a meal, human?"
            ]));
    }

    let actionMap = new Map();
    actionMap.set(NAME_ACTION, makeName);
    actionMap.set(INTENT_START_INSTRUCTION, startInstruction);
    actionMap.set(ACTION_NEXT_INSTRUCTION, next);
    actionMap.set(ACTION_PREVIOUS_INSTRUCTION, previous);
    actionMap.set(ACTION_CONTINUE_INSTRUCTION, continueInstructions);
    actionMap.set(ACTION_REPEAT_INSTRUCTION, repeat);
    actionMap.set(ACTION_GET_INGREDIENT, getIngredient);
    actionMap.set(ACTION_GET_IMAGE, getImage);
    actionMap.set(ACTION_SUGGEST_RECIPE, suggestRecipe);
    actionMap.set(ACTION_SUGGESTION_FOLLOWUP_NO, listRecipes);
    actionMap.set(ACTION_SUGGESTION_FOLLOWUP_YES, checkIngredients);
    actionMap.set(ACTION_SUGGESTION_FOLLOWUP_FOOD, selectRecipe);
    actionMap.set(ACTION_SELECT_RECIPE, selectRecipe);
    // actionMap.set("entry_point", initialize);
    actionMap.set('ingredients.check-followup-yes', startInstruction);
    actionMap.set('test', test);
    actionMap.set('testAudio', testAudio);

    app.handleRequest(actionMap);
});
// [END ChefAI]
