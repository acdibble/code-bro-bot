defmodule CodeBroBot.Application do
  use Application

  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: CodeBroBot.Server, options: [port: 4001]},
      CodeBroBot.Handlers.Supervisor
    ]

    opts = [strategy: :one_for_one, name: CodeBroBot.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
