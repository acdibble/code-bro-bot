defmodule CodeBroBot.ServerTest do
  use ExUnit.Case, async: true
  doctest(Fibonacci)
  use Plug.Test

  @slack_url "https://slack.com/api/chat.postMessage"

  setup do
    [mock_server: MockHttp.start_link(nil)]
  end

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
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200
    assert body == Jason.encode!(%{"challenge" => "world"})
  end

  test "handles unknown events" do
    expected = "I don't know what to do with my hands"

    spy = MockHttp.create_spy(expected)

    body =
      app_mention_body("foobar")
      |> Jason.encode!()

    {status, _header, _body} =
      authenticated_conn(:post, "/events", body)
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200

    [url, response_body, headers] = Task.await(spy)
    assert url == @slack_url
    assert Jason.decode!(response_body) == %{"channel" => "test", "text" => expected}

    assert headers == [
             {"content-type", "application/json;charset=utf8"},
             {"authorization", "Bearer #{Application.get_env(:code_bro_bot, :slack_oauth_token)}"}
           ]
  end

  test "handles version events" do
    expected = Application.spec(:code_bro_bot, :vsn) |> to_string()

    spy = MockHttp.create_spy(expected)

    body =
      app_mention_body("version")
      |> Jason.encode!()

    {status, _header, _body} =
      authenticated_conn(:post, "/events", body)
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200

    response_body = Task.await(spy) |> Enum.at(1)
    assert Jason.decode!(response_body) == %{"channel" => "test", "text" => expected}
  end

  test "handles fibonacci events" do
    expected = "55"
    spy = MockHttp.create_spy(expected)

    body =
      app_mention_body("fibonacci 10")
      |> Jason.encode!()

    {status, _header, _body} =
      authenticated_conn(:post, "/events", body)
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200

    response_body = Task.await(spy) |> Enum.at(1)
    assert Jason.decode!(response_body) == %{"channel" => "test", "text" => expected}
  end

  test "handles source code events" do
    expected = "https://github.com/acdibble/code-bro-bot"
    spy = MockHttp.create_spy(expected)

    body =
      app_mention_body("your source")
      |> Jason.encode!()

    {status, _header, _body} =
      authenticated_conn(:post, "/events", body)
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200

    response_body = Task.await(spy) |> Enum.at(1)
    assert Jason.decode!(response_body) == %{"channel" => "test", "text" => expected}
  end

  test "handles bare mentions events" do
    expected = "<@Y4B01>?"
    spy = MockHttp.create_spy(expected)

    body =
      app_mention_body("", user: "Y4B01")
      |> Jason.encode!()

    {status, _header, _body} =
      authenticated_conn(:post, "/events", body)
      |> CodeBroBot.Server.call(%{})
      |> sent_resp()

    assert status == 200

    response_body = Task.await(spy) |> Enum.at(1)
    assert Jason.decode!(response_body) == %{"channel" => "test", "text" => expected}
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
    |> put_req_header("content-type", "application/json")
  end

  defp app_mention_body(text, opts \\ []) do
    channel = Keyword.get(opts, :channel, "test")
    user = Keyword.get(opts, :user, "test")

    %{
      "event" => %{
        "type" => "app_mention",
        "channel" => channel,
        "text" => String.trim("<@C0D3B4O> #{text}"),
        "user" => user
      }
    }
  end
end
