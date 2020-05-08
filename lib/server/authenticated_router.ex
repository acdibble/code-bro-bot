defmodule CodeBroBot.Server.AuthenticatedRouter do
  use Plug.Router

  plug(:match)

  plug(Plug.Parsers,
    parsers: [:json],
    json_decoder: Jason,
    body_reader: {CodeBroBot.Server.AuthenticatedRouter, :read_body, []}
  )

  plug(CodeBroBot.Server.VerifySignature)

  plug(:respond_to_challenge)
  plug(:dispatch)

  match "/", assigns: %{type: :event} do
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

  def read_body(conn, opts) do
    {:ok, body, conn} = Plug.Conn.read_body(conn, opts)
    conn = update_in(conn.assigns[:raw_body], &[body | &1 || []])
    {:ok, body, conn}
  end
end
