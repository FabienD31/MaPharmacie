// Configuration Metro, le bundler de React Native.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Force la résolution des paquets vers leur version CommonJS.
 *
 * Le SDK Anthropic contient un cycle d'imports interne :
 *   resources/beta/messages/messages.mjs
 *     → lib/tools/BetaToolRunner.mjs
 *       → resources/beta.mjs
 *         → resources/beta/messages/messages.mjs
 *
 * Node et les bundlers web résolvent ce cycle grâce aux liaisons différées des
 * modules ES. Metro, lui, évalue les modules dans l'ordre et se retrouve avec
 * `BetaToolRunner` à `undefined`, ce qui fait planter l'application dès
 * l'import du SDK (`Cannot read property 'BetaToolRunner' of undefined`).
 *
 * En demandant la condition « require », Metro charge les fichiers CommonJS du
 * paquet, dont les exports sont résolus à l'appel et non à l'évaluation : le
 * cycle devient inoffensif.
 */
config.resolver.unstable_conditionNames = ['require', 'react-native', 'default'];

module.exports = config;
