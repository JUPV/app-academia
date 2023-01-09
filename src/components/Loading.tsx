import { Spinner, Center } from 'native-base'; //Spinner componente que indica o carregameto da pagina

export function Loading(){
    return(
        <Center flex={1} bg="gray.700">
          <Spinner color="green.500"/>
        </Center>
    );    
}