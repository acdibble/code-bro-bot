defmodule CodeBroBot.Application do
  use Application

  def start(_type, _args) do
    children = [
      {Plug.Cowboy, scheme: :http, plug: CodeBroBot.Server, options: [port: port()]},
      CodeBroBot.Handlers.Supervisor
    ]

    opts = [strategy: :one_for_one, name: CodeBroBot.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp port, do: Application.get_env(CodeBroBot, :port)
end
