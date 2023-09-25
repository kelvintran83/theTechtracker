import React, {useRef, useState} from "react"
import {Form, Button, Card, Container, Alert} from "react-bootstrap"
import {useAuth} from "../../contexts/AuthContexts"
import "bootstrap/dist/css/bootstrap.min.css"
import {Link, useNavigate} from "react-router-dom"




export default function SignUp(){
const userRef = useRef()
const passwordRef = useRef()
const  passwordConfirmRef = useRef()
const {signup} = useAuth()
const [error, setError] = useState("")
const [loading, setLoading] = useState(false)
const navigate = useNavigate()

// This function handles the form submit process, It will pass the parameters of passwordRef (password) and passwordConfirmRef (conmfirm password) to the firebase useAuth.signup method to authenticate login. If successful it will use React navigate to the home page, if not the error will be displayed.

async function handleSubmit(e) {
  e.preventDefault()

  if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError("Passwords do not match")
  }

  try {     
    
     setError("")
     setLoading(true)
     await signup(userRef.current.value, passwordRef.current.value)
     navigate("/")

  } catch (error){
    setError("Error creating account: " + error)
  }
  setLoading(false)
}
  // Simple bootstrap login form UI
  return (
      <Container className="d-flex align-items-center justify-content-center" >
        <div className="w-50" style={{minWidth:"500px"}}>
         <Card className="mx-auto">
          <Card.Body>
            <h2 className="text-center">Sign Up</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group id="email">
                <Form.Label>Email :</Form.Label>
                <Form.Control type="email" ref={userRef} required/>
              </Form.Group>
              <Form.Group id="password">
                <Form.Label>Password :</Form.Label>        
                <Form.Control type="password" ref={passwordRef}required/>
              </Form.Group>
              <Form.Group id="confirm-password">
                <Form.Label>Confirm Password :</Form.Label>        
                <Form.Control type="password" ref={passwordConfirmRef}required/>
              </Form.Group>
              <div className="text-center">
                <Button disabled={loading} className="mt-3 align-center" type="submit">Confirm</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>        
        <div className="w-100 text-center mt-2">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
        </div>

      </Container>
  )
}