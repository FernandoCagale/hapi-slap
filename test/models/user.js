export default (sequelize, DataType) => {
  const User = sequelize.define('User', {
    username: {
      type: DataType.STRING(40),
      allowNull: false,
      unique: true
    },
    firstName: {
      type: DataType.STRING(100),
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataType.STRING(50),
      allowNull: false,
      field: 'last_name'
    },
    email: {
      type: DataType.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataType.STRING(200),
      allowNull: false
    }
  }, {
    createdAt: 'created_at',
    updatedAt: 'update_at',
    tableName: 'users'
  });

  return User;
};
