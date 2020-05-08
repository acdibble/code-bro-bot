defmodule CodeBroBot.Slack.Request do
  @oauth_token Application.get_env(:code_bro_bot, :slack_oauth_token)

  def call(body) do
    HTTPoison.post(
      "https://slack.com/api/chat.postMessage",
      Jason.encode!(body),
      [
        {"content-type", "application/json;charset=utf8"},
        {"authorization", "Bearer #{@oauth_token}"}
      ]
    )
  end
end
