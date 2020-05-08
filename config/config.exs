import Config

config(:code_bro_bot, port: 3000)

try do
  import_config("#{Mix.env()}.exs")
rescue
  _ ->
    IO.puts("WARNING: COULD NOT FIND CONFIG FOR ENV \"#{Mix.env()}\"")
end
