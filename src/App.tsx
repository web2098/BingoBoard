// import React from 'react';
// import logo from './logo.svg';
// import './App.css';
// import { useState } from 'react';


// function BoardLineHeader({value}: {value:string})
// {
//   return (
//     <p className="board-line-header">
//       {value}
//     </p>
//   );
// }

// function Square({value, onClick}: {value: string, onClick: any}){
//   return (
//     <td className="Square" onClick={onClick}>
//       {value}
//     </td>
//   );
// }

// function Board(){
//   // Create a board of 5x15 squares with the values 1 to 75
//   // The board should have a line break after every 15 squares

//   let board = []
//   const rowLabels = ['B', 'I', 'N', 'G', 'O'];

//   for (let i = 0; i < 5; i++) {
//     let row = [];
//     row.push(<BoardLineHeader key={`header-${i}`} value={rowLabels[i]} />);
//     for (let j = 0; j < 15; j++) {
//       row.push(<Square key={`square-${i}-${j}`} value={String(i * 15 + j + 1)} onClick={() => console.log("click")} />);
//     }
//     board.push(<div key={`row-${i}`} style={{ display: 'flex', alignItems: 'center' }}>{row}</div>);
//   }

//   return (
//     <div>
//       {board}
//     </div>
//   );
// }


import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import SelectGamePage from './routes/select-game-page';
import BoardPage from './routes/board-page';
import SettingsPage from './routes/settings-page';
import About from './routes/about-page';
import ErrorPage from "./routes/error-page";

export default function MyApp() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <SelectGamePage />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/BingoBoard",
      element: <SelectGamePage />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/BingoBoard/select-game",
      element: <SelectGamePage />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/BingoBoard/board",
      element: <BoardPage />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/BingoBoard/settings",
      element: <SettingsPage />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/BingoBoard/about",
      element: <About />,
      errorElement: <ErrorPage />,
    },
  ]);

  return (
    <RouterProvider router={router} />
  );
}

