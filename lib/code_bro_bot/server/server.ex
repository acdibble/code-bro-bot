defmodule CodeBroBot.Server do
  use Plug.Router

  plug(:match)

  plug(Plug.Parsers,
    parsers: [:json],
    json_decoder: Jason,
    body_reader: {CodeBroBot.Server, :read_body, []}
  )

  plug(:verify_signature)

  plug(:dispatch)

  get "/ping" do
    conn
    |> IO.inspect()
    |> send_resp(200, "pong\n")
  end

  forward("/events", to: CodeBroBot.Server.EventsRouter)

  def read_body(conn, opts) do
    {:ok, body, conn} = Plug.Conn.read_body(conn, opts)
    conn = update_in(conn.assigns[:raw_body], &[body | &1 || []])
    {:ok, body, conn}
  end

  defp verify_signature(conn, _opts) do
    {body, _} = Map.pop(conn.assigns, :raw_body)

    IO.inspect(body)
    conn
  end
end
