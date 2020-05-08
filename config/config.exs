import Config

config(:code_bro_bot, port: 3000)

import_config("#{Mix.env()}.exs")
