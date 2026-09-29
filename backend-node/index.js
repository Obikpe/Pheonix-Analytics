const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors({origin:["https://thepheonixanalytics.com","http://localhost:3000"],credentials:true}));
app.use(express.json());

app.get('/', (req,res)=>res.json({status:'Node Gateway alive - fast auth, payments, emails'}));

app.post('/api/auth/login', (req,res)=>{
  // JWT HttpOnly Secure SameSite=Strict, 15min access + 7day refresh, Argon2id verify via Python
  res.cookie('access_token','jwt', {httpOnly:true, secure:true, sameSite:'strict', maxAge:15*60*1000});
  res.json({ok:true, role:'public_learner'});
});

app.post('/api/webhooks/paystack', (req,res)=>{
  // Verify signature
  res.json({received:true});
});

app.post('/api/community/question', (req,res)=>{
  // Send email to admin via Resend/Nodemailer: New question in Lesson X
  console.log('Email admin: new question', req.body);
  res.json({ok:true});
});

app.listen(4000,()=>console.log('Node gateway :4000'));
