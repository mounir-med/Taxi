import neoSchema from "../schema/transport.schema.js";
import { graphql } from "graphql";
import driver from "../config/neo4j.js";

let schema;

async function getSchema() {
  if (!schema) {
    schema = await neoSchema.getSchema();
  }
  return schema;
}

// CREATE
export async function createStation({ name, code }) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($name: String!, $code: String!) {
        createStations(input: { name: $name, code: $code }) {
          stations {
            id
            name
            code
          }
        }
      }
    `,
    variableValues: { name, code },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.createStations.stations[0];
}

// READ ALL
export async function getStations() {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      query {
        stations {
          id
          name
          code
        }
      }
    `,
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.stations;
}

// READ BY ID
export async function getStationById(id) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      query ($id: ID!) {
        stations(where: { id: { eq: $id } }) {
          id
          name
          code
        }
      }
    `,
    variableValues: { id },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);
  return result.data.stations[0] || null;
}

export async function updateStation(id, { name, code }) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($id: ID!, $name: String!, $code: String!) {
        updateStations(
          where: { id: { eq: $id } }
          update: {
            name: { set: $name }
            code: { set: $code }
          }
        ) {
          stations {
            id
            name
            code
          }
        }
      }
    `,
    variableValues: { id, name, code },
    contextValue: { driver }
  });

  if (result.errors) throw new Error(result.errors[0].message);

  return result.data.updateStations.stations[0] || null;
}




export async function deleteStation(id) {
  const schema = await getSchema();

  const result = await graphql({
    schema,
    source: `
      mutation ($id: ID!) {
        deleteStations(
          where: { id: { eq: $id } }
        ) {
          nodesDeleted
        }
      }
    `,
    variableValues: { id },
    contextValue: { driver }
  });

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data.deleteStations.nodesDeleted;
}

