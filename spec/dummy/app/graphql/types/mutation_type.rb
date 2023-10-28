# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    def update_user(user_id:, newName:)
      user = User.find(user_id)
      user.update!(name: newName)
      user
    end

    field :update_user, Types::UserType, null: false do
      argument :user_id, ID, required: true
      argument :newName, String, required: true
    end
  end
end
