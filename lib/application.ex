defmodule CodeBroBot do
  use Application

  @port Application.get_env(:code_bro_bot, :port)

  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: CodeBroBot.Server, options: [port: @port]},
      CodeBroBot.Handlers.Supervisor
    ]

    opts = [strategy: :one_for_one, name: CodeBroBot.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
