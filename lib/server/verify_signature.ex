defmodule CodeBroBot.Server.VerifySignature do
  use Plug.Builder

  @signing_secret Application.get_env(:code_bro_bot, :slack_signing_secret)

  plug(:check_timestamp)
  plug(:check_signature)

  def check_timestamp(conn, _opts) do
    conn
    |> Plug.Conn.get_req_header("x-slack-request-timestamp")
    |> Enum.at(0, "0")
    |> String.to_integer()
    |> request_is_fresh?()
    |> pass_if_true(conn)
  end

  def check_signature(conn, _opts) do
    {raw_body, _} = Map.pop(conn.assigns, :raw_body)
    body = Enum.join(raw_body)

    timestamp =
      Plug.Conn.get_req_header(conn, "x-slack-request-timestamp")
      |> Enum.at(0)

    signed_string =
      :crypto.hmac(:sha256, @signing_secret, "v0:#{timestamp}:#{body}")
      |> Base.encode16(case: :lower)

    signature = "v0=#{signed_string}"

    Plug.Conn.get_req_header(conn, "x-slack-signature")
    |> Enum.at(0, "")
    |> Plug.Crypto.secure_compare(signature)
    |> pass_if_true(conn)
  end

  defp pass_if_true(true, conn), do: conn

  defp pass_if_true(false, conn) do
    Plug.Conn.send_resp(conn, 401, "")
    |> Plug.Conn.halt()
  end

  @spec request_is_fresh?(number) :: boolean

  defp request_is_fresh?(timestamp) do
    DateTime.utc_now()
    |> DateTime.to_unix()
    |> Kernel.-(timestamp)
    |> Kernel.<=(5 * 60)
  end
end
