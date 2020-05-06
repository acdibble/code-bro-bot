defmodule CodeBroBot.Application do
  use Application

  def start(_type, _args) do
    port = System.get_env("PORT", "8080") |> String.to_integer()

    children = [
      {Plug.Cowboy, scheme: :http, plug: CodeBroBot.Server, options: [port: port]},
      CodeBroBot.Handlers.Supervisor
    ]

    opts = [strategy: :one_for_one, name: CodeBroBot.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
