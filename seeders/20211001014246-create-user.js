"use strict";
const { v4: uuidv4 } = require("uuid");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */

    return queryInterface.bulkInsert("users", [
      {
        name: "local",
        email: "local@gmail.com",
        uuid: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Jane Doe",
        email: "Jane@gmail.com",
        uuid: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "James Doe",
        email: "james_poxhyxm_doe@tfbnw.net",
        uuid: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */

    return queryInterface.bulkDelete("users", null, {});
  },
};
