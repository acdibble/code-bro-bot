defmodule CodeBroBot.Server.EventsRouter do
  use Plug.Router

  plug(:match)
  plug(:respond_to_challenge)
  plug(:dispatch)

  post "/" do
    conn
    |> CodeBroBot.Handlers.Events.process()
    |> send_resp(200, "")
  end

  defp respond_to_challenge(%Plug.Conn{body_params: %{"challenge" => challenge}} = conn, _) do
    conn
    |> send_resp(200, Jason.encode!(%{challenge: challenge}))
    |> halt()
  end

  defp respond_to_challenge(conn, _), do: conn
end
