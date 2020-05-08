import Config

config(
  :code_bro_bot,
  port: System.fetch_env!("PORT"),
  slack_signing_secret: System.fetch_env!("SLACK_SIGNING_SECRET"),
  slack_oauth_token: System.fetch_env!("SLACK_OAUTH_TOKEN")
)
