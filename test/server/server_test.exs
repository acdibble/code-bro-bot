defmodule CodeBroBot.ServerTest do
  use ExUnit.Case, async: true
  use Plug.Test

  test "pongs" do
    {status, _header, body} =
      conn(:get, "/ping")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200
    assert body == "pong\n"
  end

  test "handles unknown routes" do
    {status, _header, body} =
      conn(:post, "/404")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 404
    assert body == "oops"
  end

  test "sends 401 without timestamp" do
    body = Jason.encode!(%{"challenge" => "world", "other" => "property"})

    {status, _header, body} =
      conn(:post, "/events", body)
      |> put_req_header("content-type", "application/json")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 401
    assert body == ""
  end

  test "with bad signature" do
    body = Jason.encode!(%{"challenge" => "world", "other" => "property"})

    timestamp = DateTime.utc_now() |> DateTime.to_unix() |> Integer.to_string()

    {status, _header, body} =
      conn(:post, "/events", body)
      |> put_req_header("content-type", "application/json")
      |> put_req_header("x-slack-request-timestamp", timestamp)
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 401
    assert body == ""
  end

  test "responds to challenges" do
    body = Jason.encode!(%{"challenge" => "world", "other" => "property"})

    {status, _header, body} =
      authenticated_conn(:post, "/events", body)
      |> put_req_header("content-type", "application/json")
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200
    assert body == Jason.encode!(%{"challenge" => "world"})
  end

  defp authenticated_conn(method, path, params_or_body) do
    timestamp = DateTime.utc_now() |> DateTime.to_unix() |> Integer.to_string()
    string = "v0:#{timestamp}:#{params_or_body}"

    signature =
      :crypto.hmac(:sha256, Application.get_env(:code_bro_bot, :slack_signing_secret), string)
      |> Base.encode16(case: :lower)

    conn(method, path, params_or_body)
    |> put_req_header("x-slack-request-timestamp", timestamp)
    |> put_req_header("x-slack-signature", "v0=#{signature}")
  end
end
