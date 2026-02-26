'''
Redis Conversational Agent
Uses RedisVL Semantic Message History to manage conversation history

To run this code:
    Install dependencies:
        pip install redisvl[all] redis os openai

    Set environment variables:
        export LLM_API_KEY=your_${formData.llmModel.toLowerCase()}_api_key
        export LLM_API_BASE_URL=your_${formData.llmModel.toLowerCase()}_api_base_url
            (optional - default: ${CONFIG.models[formData.llmModel].baseUrl})
        export LLM_MODEL=your_${formData.llmModel.toLowerCase()}_model 
            (optional - default: ${CONFIG.models[formData.llmModel].defaultModel})
        export REDIS_HOST=your_redis_host
        export REDIS_PORT=your_redis_port
        export REDIS_PASSWORD=your_redis_password
'''

from redisvl.extensions.message_history import SemanticMessageHistory
import redis
import os
import openai

class ConversationalAgent:
    def __init__(self, session_name="chat"):       
        # Get API key from environment variables
        self.llm_api_key = os.getenv('LLM_API_KEY')
        if not self.llm_api_key:
            raise ValueError("LLM_API_KEY environment variable is required")
        self.llm_base_url = os.getenv('LLM_API_BASE_URL', '${CONFIG.models[formData.llmModel].baseUrl}')
        self.llm_model = os.getenv('LLM_MODEL', '${CONFIG.models[formData.llmModel].defaultModel}')

        # Connect to Redis
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                username=os.getenv('REDIS_USERNAME', 'default'),
                password=os.getenv('REDIS_PASSWORD', ''),
                decode_responses=True
            )
            # Test Redis connection
            self.redis_client.ping()
            print("Connected to Redis successfully")

        except redis.ConnectionError as e:
            print(f"Failed to connect to Redis: {e}")
            print("Please check your Redis connection settings and ensure Redis is running.")
            raise
        except Exception as e:
            print(f"Redis connection error: {e}")
            raise
        
        # Initialize LLM client with error handling
        try:
            self.client = openai.OpenAI(api_key=self.llm_api_key, base_url=self.llm_base_url)
            # Test LLM connection with a simple call
            test_response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            print("Connected to LLM successfully")

        except openai.AuthenticationError:
            print("LLM authentication failed. Please check your API key.")
            raise
        except Exception as e:
            print(f"LLM connection error: {e}")
            raise
        
        # Initialize session manager
        self.session_manager = SemanticMessageHistory(
            name=session_name,
            redis_client=self.redis_client
        )
    
    def chat(self, user_input: str, session_tag: str = None) -> str:
        # Get relevant conversation history
        self.session_manager.set_distance_threshold(0.9)
        context = self.session_manager.get_relevant(user_input, top_k=8)
        
        # Build messages with context
        messages = [{"role": "system", "content": "You are a helpful assistant that will answer questions based on the conversation history."}]
        messages.extend(context)
        messages.append({"role": "user", "content": user_input})

        # Get LLM response
        try:
            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=messages
            )
        except Exception as e:
            print(f"Error getting LLM response: {e}")
            return "Sorry, I'm having trouble understanding your question. Please try again later."

        assistant_response = response.choices[0].message.content
        
        # Store the conversation
        try:
            self.session_manager.add_messages([
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": assistant_response}
            ], session_tag)
        except Exception as e:
            print(f"Error storing conversation: {e}")

        return assistant_response
    
if __name__ == "__main__":
    try:
        agent = ConversationalAgent()
        print(agent.chat("Tell me about yourself."))
        while True:
            try:
                prompt = input('Enter a prompt: ')

                if prompt.lower() in ['quit', 'exit', 'bye']:
                    print("Thanks for using! Goodbye!")
                    break

                print(agent.chat(prompt))
            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            except Exception as e:
                print(f"An error occurred: {e}")
                print("Please try again or type 'quit' to exit.")
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("Please check your environment variables and try again.")
        exit(1)
    except Exception as e:
        print(f"Failed to initialize the conversational agent: {e}")
        exit(1)