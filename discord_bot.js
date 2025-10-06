const { Client, GatewayIntentBits } = require('discord.js');

// Créez une nouvelle instance de client
// Les "Intents" définissent les événements que votre bot recevra.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Nécessaire pour lire le contenu des messages
    ]
});

// Remplacez ceci par le token de votre bot
const token = 'VOTRE_TOKEN_DISCORD_ICI';

// Quand le client est prêt, ce code s'exécute (une seule fois)
client.once('ready', () => {
    console.log(`Prêt ! Connecté en tant que ${client.user.tag}`);
});

// Écoute les messages
client.on('messageCreate', message => {
    // Ignore les messages des autres bots pour éviter les boucles
    if (message.author.bot) return;

    // Vérifie si le message est la commande !ping
    if (message.content === '!ping') {
        // Répond "Pong!" avec la latence du message
        const latency = Date.now() - message.createdTimestamp;
        message.reply(`Pong ! Latence : ${latency}ms.`);
    }
});

// Connectez-vous à Discord avec le token de votre client
client.login(token);
