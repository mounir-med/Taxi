import { Neo4jGraphQL } from "@neo4j/graphql";
import { gql } from "graphql-tag";
import driver from "../config/neo4j.js";

const typeDefs = gql`
  type Station @node {
    id: ID! @id
    name: String!
    code: String!
    connectedTo: [Station!]!
      @relationship(type: "CONNECTED_TO", direction: OUT)
  }

type Passager @node {
  id: ID! @id
  name: String!
  voyages: [Station!]! @relationship(type: "VOYAGE", direction: OUT)
}

  type Ligne @node {
    id: ID! @id
    name: String!
    stations: [Station!]!
      @relationship(type: "HAS_STATION", direction: OUT)
  }
`;

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  driver
});

export default neoSchema;
