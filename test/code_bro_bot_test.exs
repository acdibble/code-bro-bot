defmodule CodeBroBotTest do
  use ExUnit.Case
  doctest CodeBroBot

  test "greets the world" do
    assert CodeBroBot.hello() == :world
  end
end
