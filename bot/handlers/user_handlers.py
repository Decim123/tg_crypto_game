from aiogram import Router, F, Bot, types
from aiogram.filters import Command, CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
from lexicon.lexicon_en import LEXICON_EN

router = Router()
user_states = {}

url = 'https://groovyskater.xyz/'

@router.message(CommandStart())
async def process_start_command(message: Message):

    try:
        args = message.text.split()[1]
    except:
        args = None
    path_to_photo = "/var/www/tg_crypto_game/bot/img/start_img.png"

    if args:
        inline_kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="Let's go", web_app=types.WebAppInfo(url=f"{url}?ref={args}")),
                InlineKeyboardButton(text="Join community", url="https://t.me/TGRExchange")
            ]
        ])  
        caption = LEXICON_EN['/start'] + str(args)
    else:
        inline_kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(text="Let's go", web_app=types.WebAppInfo(url=url)),
                InlineKeyboardButton(text="Join community", url="https://t.me/TGRExchange")
            ]
        ])  
        caption = LEXICON_EN['/start']
    
    

    await message.answer_photo(
        types.FSInputFile(path=path_to_photo),
        caption=caption,
        reply_markup=inline_kb
    )
