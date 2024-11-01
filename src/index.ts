import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import dotenv from "dotenv";
import "es6-shim";
import express, { Express, Request, Response } from "express";
import { Pool } from "pg";
import "reflect-metadata";
import { Board } from "./dto/board.dto";
import { User } from "./dto/user.dto";
import { Card } from "./dto/card.dto";
import { List } from "./dto/list.dto";
import { CardUser } from "./dto/carduser.dto";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: +process.env.DB_PORT!,
});

const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/users", async (req: Request, res: Response) => {
  try{
    const text = "SELECT id, name, email FROM users";
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  }catch (errors) {
    return res.status(400).json(errors);
  }
});

app.post("/users", async (req: Request, res: Response) => {
  let userDto: User = plainToClass(User, req.body);
  try{
    await validateOrReject(userDto);

    const text = "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *";
    const values = [userDto.name, userDto.email];
    const result = await pool.query(text, values);
    res.status(201).json(result.rows[0]);
  }catch (errors) {
    return res.status(422).json(errors);
  }
});

app.get("/boards", async (req: Request, res: Response) => {
  try{
    const text =
      'SELECT b.id, b.name, bu.userId "adminUserId" FROM boards b JOIN board_users bu ON bu.boardId = b.id WHERE bu.isAdmin IS true';
    const result = await pool.query(text);
    res.status(200).json(result.rows);
  }catch (errors) {
    return res.status(400).json(errors);
  }
});

app.post("/boards", async (req: Request, res: Response) => {
  let boardDto: Board = plainToClass(Board, req.body);
  const client = await pool.connect();
  try{
    client.query("BEGIN");
    await validateOrReject(boardDto, {});

    const boardText = "INSERT INTO boards(name) VALUES($1) RETURNING *";
    const boardValues = [boardDto.name];
    const boardResult = await client.query(boardText, boardValues);

    const boardUserText =
      "INSERT INTO board_users(boardId, userId, isAdmin) VALUES($1, $2, $3)";
    const boardUserValues = [
      boardResult.rows[0].id,
      boardDto.adminUserId,
      true,
    ];
    await client.query(boardUserText, boardUserValues);

    client.query("COMMIT");
    res.status(201).json(boardResult.rows[0]);
  }catch (errors) {
    client.query("ROLLBACK");
    return res.status(422).json(errors);
  }finally {
    client.release();
  }
});

//1. Get lists by board
app.get("/boards/:boardId/list", async (req: Request, res: Response) => {
  const { boardId } = req.params;
  try{
    const text =
      'SELECT id, name, boardId FROM list WHERE boardId = $1';
    const values = [boardId];
    const result = await pool.query(text,values);

    res.status(200).json(result.rows);
  }catch (errors) {
    return res.status(400).json(errors);
  }
});

//2. Create list for board
app.post("/list", async (req: Request, res: Response) => {
  let listDto: List = plainToClass(List, req.body);
  try{
    await validateOrReject(listDto, {});

    const listText = "INSERT INTO list(name, boardId) VALUES($1, $2) RETURNING *";
    const listValues = [listDto.name,listDto.boardId];
    const listResult = await pool.query(listText, listValues);

    res.status(201).json(listResult.rows[0]);
  }catch (errors) {
    return res.status(422).json(errors);
  }
});

// 4. Get cards by list with owner user name
app.get("/list/:listId/card", async (req: Request, res: Response) => {
  const { listId } = req.params;
  try{
    const text = "SELECT c.id, c.titulo, c.descripcion, c.fecha_tope, c.list_id, u.name FROM card c JOIN card_users cu ON cu.card_id = c.id JOIN users u ON u.id = cu.user_id WHERE c.list_id = $1 AND cu.is_owner = true";
    const values = [listId];
    const result = await pool.query(text,values);
    res.status(200).json(result.rows);
  }catch (errors) {
    return res.status(400).json(errors);
  }
});

// 3. Create card for list (store owner user)
app.post("/card", async (req: Request, res: Response) => {
  let cardDto: Card = plainToClass(Card, req.body);
  const client = await pool.connect();
  try {
    client.query("BEGIN");
    await validateOrReject(cardDto, {});

    const text = "INSERT INTO card(titulo, descripcion, fecha_tope, list_id) VALUES($1, $2, $3, $4) RETURNING *";
    const values = [cardDto.titulo, cardDto.descripcion, cardDto.fecha_tope,cardDto.listId];
    const cardResult = await client.query(text, values);

    const cardUserText =
      "INSERT INTO card_users(card_id, user_id, is_owner) VALUES($1, $2, $3)";
    const cardUserValues = [
      cardResult.rows[0].id,
      cardDto.adminUserId,
      true,
    ];
    await client.query(cardUserText, cardUserValues);

    client.query("COMMIT");
    res.status(201).json(cardResult.rows[0]);
  }catch (errors) {
    client.query("ROLLBACK");
    return res.status(422).json(errors);
  }finally {
    client.release();
  }
});

// 5. Assign user to card
app.post("/carduser", async (req: Request, res: Response) => {
  let carduserDto: CardUser = plainToClass(CardUser, req.body);
  try {
    await validateOrReject(carduserDto);

    const cardUserText =
      "INSERT INTO card_users (card_id, user_id, is_owner) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM card_users WHERE card_id = $1 AND user_id = $2);";
    const cardUserValues = [
      carduserDto.cardId,
      carduserDto.userId,
      true
    ];
    const carduserResult = await pool.query(cardUserText, cardUserValues);
    res.status(201).json(carduserResult.rows[0]);
  }catch (errors) {
    return res.status(422).json(errors);
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});