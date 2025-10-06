
import discord
from discord.ext import commands

# Définit les autorisations (intents) dont le bot a besoin.
# Pour lire les messages, '''message_content''' est nécessaire.
intents = discord.Intents.default()
intents.message_content = True

# Crée une instance de bot avec le préfixe de commande "!" et les intents.
bot = commands.Bot(command_prefix='!', intents=intents)

# Événement qui se déclenche lorsque le bot est prêt et connecté.
@bot.event
async def on_ready():
    print(f'Connecté en tant que {bot.user.name}!')

# Définit la commande !ping.
@bot.command()
async def ping(ctx):
    """Répond Pong! à la commande !ping."""
    await ctx.send('Pong!')

# Lance le bot avec votre token.
# Remplacez 'VOTRE_TOKEN_ICI' par le vrai token de votre bot.
bot.run('VOTRE_TOKEN_ICI')
