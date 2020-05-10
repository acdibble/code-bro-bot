defmodule CodeBroBot.Slack.Request do
  @oauth_token Application.get_env(:code_bro_bot, :slack_oauth_token)

  def call(body) do
    args = [
      "https://slack.com/api/chat.postMessage",
      Jason.encode!(body),
      [
        {"content-type", "application/json;charset=utf8"},
        {"authorization", "Bearer #{@oauth_token}"}
      ]
    ]

    apply(get_client(), :post, args)
  end

  defp get_client, do: Application.get_env(:code_bro_bot, :http_client, HTTPoison)
end
