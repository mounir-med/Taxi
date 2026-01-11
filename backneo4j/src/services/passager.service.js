import neoSchema from "../schema/transport.schema.js";
import { graphql } from "graphql";
import driver from "../config/neo4j.js";

let schema;

async function getSchema() {
  if (!schema) schema = await neoSchema.getSchema();
  return schema;
}

// CREATE
export async function createPassager({ name }) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($name: String!) {
        createPassagers(input: { name: $name }) {
          passagers {
            id
            name
          }
        }
      }
    `,
    variableValues: { name },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.createPassagers.passagers[0];
}

// READ ALL
export async function getPassagers() {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      query {
        passagers {
          id
          name
        }
      }
    `,
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.passagers;
}

// READ BY ID
export async function getPassagerById(id) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      query ($id: ID!) {
        passagers(where: { id: { eq: $id } }) {
          id
          name
          voyages {
            id
            name
            code
          }
        }
      }
    `,
    variableValues: { id },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.passagers[0] || null;
}

// UPDATE
export async function updatePassager(id, { name }) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($id: ID!, $name: String!) {
        updatePassagers(
          where: { id: { eq: $id } }
          update: { name: { set: $name } }
        ) {
          passagers {
            id
            name
          }
        }
      }
    `,
    variableValues: { id, name },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.updatePassagers.passagers[0] || null;
}

// DELETE
export async function deletePassager(id) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($id: ID!) {
        deletePassagers(where: { id: { eq: $id } }) {
          nodesDeleted
        }
      }
    `,
    variableValues: { id },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.deletePassagers.nodesDeleted > 0;
}
// -------------------------------------------------------------
export async function addVoyage(passagerId, stationId) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($passagerId: ID!, $stationId: ID!) {
        updatePassagers(
          where: { id: { eq: $passagerId } }
          update: {
            voyages: {
              connect: [{ where: { node: { id: { eq: $stationId } } } }]
            }
          }
        ) {
          passagers {
            id
            name
            voyages {
              id
              name
              code
            }
          }
        }
      }
    `,
    variableValues: { passagerId, stationId },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.updatePassagers.passagers[0];
}

export async function removeVoyage(passagerId, stationId) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($passagerId: ID!, $stationId: ID!) {
        updatePassagers(
          where: { id: { eq: $passagerId } }
          update: {
            voyages: {
              disconnect: [{ where: { node: { id: { eq: $stationId } } } }]
            }
          }
        ) {
          passagers {
            id
            name
            voyages {
              id
              name
              code
            }
          }
        }
      }
    `,
    variableValues: { passagerId, stationId },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.updatePassagers.passagers[0];
}

