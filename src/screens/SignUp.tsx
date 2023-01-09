
import { useNavigation } from '@react-navigation/native';
import { VStack, Image, Text, Center, Heading, ScrollView, useToast} from 'native-base';
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup'

import { api } from '@services/api'

import { Input } from '@components/Input'
import LogoSVG from '@assets/logo.svg'
import BackgroundImg from '@assets/background.png'
import { Button } from '@components/Button';
import { AppError } from '@utils/AppError';
import { useState } from 'react';
import { useAuth } from '@hooks/useAuth';

type FormDataProps = {
    name: string;
    email: string;
    senha: string;
    confirma_senha: string;
}

const signUpSchema = yup.object({
    name: yup.string().required("Informe o nome."),
    email: yup.string().required("Informe o e-mail.").email("E-mail invalido."),
    senha: yup.string().required("Informe a senha.").min(6, 'A senha deve ter pelo menos 6 digitos.'),
    confirma_senha: yup.string().required("Confirme da senha.").oneOf([yup.ref('senha'), null], 'A confirmção da senha não confere')
})

export function SignUp(){
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const toast = useToast();

    const {control, handleSubmit, formState: { errors }} = useForm<FormDataProps>({
        resolver: yupResolver(signUpSchema)
    });

    const navigation = useNavigation();
    function heandleGoBack() {
        navigation.goBack();
    }

    async function handleSignUp({name, email, senha}:FormDataProps){
        const password = senha

        try {
            setIsLoading(true);
        
            await api.post('/users', {name, email, password});
      
            await signIn(email, password)
        } catch (error) {
            setIsLoading(false)
            const isAppError = error instanceof AppError;
            const title = isAppError ? error.message : 'Não foi possível criar a conta. Tente novamente mais tarde.'
            toast.show({
                title,
                placement: 'top',
                bgColor: 'red.500'
            })
        }

        
        /*
       const response = await fetch('http://192.168.0.156:3333/users',{
        method: 'POST', 
        headers: {
            'Accept' : 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })

       })
       const data = await response.json();
   
       */


    }

    return(
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <VStack flex={1} px={10} pb={16}>
                <Image 
                    source={BackgroundImg}
                    defaultSource={BackgroundImg}
                    alt="Pessoas treinando"
                    resizeMode='contain'
                    position="absolute"
                />
                <Center my={24}>
                    <LogoSVG/>
                    <Text color="gray.100" fontSize="sm">
                        Treine sua mente e o seu corpo
                    </Text>
                </Center>
                <Center>
                    <Heading color="gray.100" fontSize="xl" mb={6} fontFamily="heading">
                        Crie sua conta
                    </Heading>

                    <Controller 
                        control={control}
                        name="name"
                        render={({field: {onChange, value}}) => (
                            <Input 
                                placeholder='Nome'
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.name?.message}
                            />
                        )}
                    />

                    <Controller 
                        control={control}
                        name="email"
                        render={({field: {onChange, value}}) => (
                            <Input 
                                placeholder='E-mail'
                                keyboardType='email-address'
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.email?.message}
                            />
                        )}
                    />

                    <Controller 
                        control={control}
                        name="senha"
                        render={({field: {onChange, value}}) => (
                            <Input 
                                placeholder='Senha'
                                secureTextEntry
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.senha?.message}
                            />
                        )}
                    />

                    <Controller 
                        control={control}
                        name="confirma_senha"
                        render={({field: {onChange, value}}) => (
                            <Input 
                                placeholder='Confirme a senha'
                                secureTextEntry
                                onChangeText={onChange}
                                value={value}
                                onSubmitEditing={handleSubmit(handleSignUp)}
                                returnKeyType="send"
                                errorMessage={errors.confirma_senha?.message}
                            />
                        )}
                    />

                    <Button 
                        title='Criar e acessar'
                        onPress={handleSubmit(handleSignUp)}
                        isLoading={isLoading}
                    />
                    
                </Center>


                <Button 
                    title='Voltar para o login' 
                    variant="outline"
                    mt={12}
                    onPress={heandleGoBack}
                />

            </VStack>
        </ScrollView>
    );
}